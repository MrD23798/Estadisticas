import { AppDataSource } from '../config/database';
import { Estadistica } from '../database/entities/Estadistica';
import { Dependencia } from '../database/entities/Dependencia';
import {
  ConsultaIndividualDTO,
  ConsultaComparativaDTO,
  EvolucionTemporalDTO,
  TopDependenciasDTO,
  ConsultaCategoriasDTO,
  DashboardResumenDTO,
  SincronizacionDTO,
  BusquedaDTO,
} from '../schemas/estadisticas.schema';

export const estadisticasService = {
  // Obtener estadísticas por dependencia
  async getByDependencia(params: ConsultaIndividualDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    const query = repository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd')
      .where('(d.nombre = :dependencia OR d.codigo = :dependencia)', { dependencia: params.dependencia });
    
    if (params.periodo) {
      query.andWhere('e.periodo = :periodo', { periodo: params.periodo });
    }
    
    if (params.incluirHistorial) {
      query.orderBy('e.periodo', 'DESC').limit(12);
    } else {
      query.orderBy('e.periodo', 'DESC').limit(1);
    }
    
    const resultados = await query.getMany();
    
    return {
      dependencia: params.dependencia,
      estadisticas: resultados.map(e => ({
        id: e.id,
        periodo: e.periodo,
        fechaEstadistica: e.fechaEstadistica,
        expedientesExistentes: e.expedientesExistentes,
        expedientesRecibidos: e.expedientesRecibidos,
        expedientesReingresados: e.expedientesReingresados,
        categoriasDetalle: e.categoriasDetalle,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
      total: resultados.length,
    };
  },

  // Obtener categorías de una dependencia
  async getCategorias(params: ConsultaCategoriasDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Paso 1: Buscar en la base de datos primero
    console.log(`🔍 Buscando datos para ${params.dependencia} en período ${params.periodo} en la base de datos...`);
    
    const estadistica = await repository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd')
      .where('(d.nombre = :dependencia OR d.codigo = :dependencia)', { dependencia: params.dependencia })
      .andWhere('e.periodo = :periodo', { periodo: params.periodo })
      .getOne();
    
    // Si encontramos datos en la BD, los retornamos inmediatamente
    if (estadistica && estadistica.categoriasDetalle) {
      console.log(`✅ Datos encontrados en base de datos para ${params.dependencia} en ${params.periodo}`);
      
      const categorias = Object.entries(estadistica.categoriasDetalle)
        .map(([nombre, datos]) => ({
          categoria: nombre,
          asignados: datos.asignados,
          reingresados: datos.reingresados,
          total: datos.asignados + datos.reingresados,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, params.topCategorias);
      
      return {
        dependencia: params.dependencia,
        periodo: params.periodo,
        categorias,
        total: categorias.length,
        origen: 'base_datos' as const,
      };
    }
    
    // Paso 2: Si no hay datos en BD y se permite buscar en Google Sheets, intentamos ahí
    if (params.buscarEnGoogleSheets) {
      console.log(`🔍 No se encontraron datos en la BD. Intentando buscar en Google Sheets...`);
      
      try {
        // Importar el servicio de Google Sheets
        const { googleSheetsService } = await import('./google.sheets.service');
        
        // Verificar que el servicio esté disponible
        if (!googleSheetsService.isAvailable()) {
          console.warn(`⚠️ Google Sheets service no está disponible`);
          throw new Error('Google Sheets service no está disponible');
        }
        
        // Buscar datos para esta dependencia y periodo en Google Sheets
        let datosEncontrados = false;
        let categoriasSheet: { categoria: string; asignados: number; reingresados: number; total: number }[] = [];
        
        // OPTIMIZACIÓN: Si la dependencia tiene un sheetName asociado, ir directo a esa hoja
        const dependenciaRepo = AppDataSource.getRepository(Dependencia);
        const dependenciaEntity = await dependenciaRepo.findOne({
          where: [
            { nombre: params.dependencia },
            { codigo: params.dependencia }
          ]
        });
        
        let sheetsToSearch: { name: string }[];
        
        if (dependenciaEntity?.sheetName) {
          // Buscar directamente en la hoja específica
          console.log(`🎯 Buscando directamente en la hoja: ${dependenciaEntity.sheetName}`);
          sheetsToSearch = [{ name: dependenciaEntity.sheetName }];
        } else {
          // Fallback: buscar en todas las hojas disponibles
          console.log(`🔍 No se encontró sheetName específico. Buscando en todas las hojas...`);
          sheetsToSearch = await googleSheetsService.listAvailableSheets();
        }
        
        // Explorar las hojas en busca de datos para esta dependencia y período
        for (const sheet of sheetsToSearch) {
          try {
            // Intentamos extraer datos de esta hoja
            const estadisticas = await googleSheetsService.extractSheetData(sheet.name);
            
            // Buscar la estadística específica que necesitamos
            const estadisticaGS = estadisticas.find(e => 
              e.dependencia === params.dependencia && 
              e.periodo === params.periodo
            );
            
            if (estadisticaGS && estadisticaGS.categoriasDetalle) {
              console.log(`✅ Datos encontrados en Google Sheets (sheet: ${sheet.name})`);
              
              // Si la dependencia no tenía sheetName, guardarlo para futuras búsquedas
              if (dependenciaEntity && !dependenciaEntity.sheetName) {
                console.log(`💾 Guardando sheetName "${sheet.name}" para ${dependenciaEntity.nombre}`);
                dependenciaEntity.sheetName = sheet.name;
                await dependenciaRepo.save(dependenciaEntity);
              }
              
              categoriasSheet = Object.entries(estadisticaGS.categoriasDetalle)
                .map(([nombre, datos]) => ({
                  categoria: nombre,
                  asignados: datos.asignados,
                  reingresados: datos.reingresados,
                  total: datos.asignados + datos.reingresados,
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, params.topCategorias);
              
              datosEncontrados = true;
              
              // Guardar en la base de datos para futuras consultas
              console.log(`💾 Guardando datos encontrados en Google Sheets a la base de datos...`);
              await googleSheetsService.saveEstadisticaToDatabase(estadisticaGS);
              
              break; // Salir del bucle una vez encontrados los datos
            }
          } catch (error) {
            console.warn(`⚠️ Error procesando hoja ${sheet.name}:`, error);
            continue; // Intentar con la siguiente hoja
          }
        }
        
        if (datosEncontrados) {
          return {
            dependencia: params.dependencia,
            periodo: params.periodo,
            categorias: categoriasSheet,
            total: categoriasSheet.length,
            origen: 'google_sheets' as const,
          };
        }
        
        console.log(`⚠️ No se encontraron datos en Google Sheets`);
      } catch (error) {
        console.error(`❌ Error buscando en Google Sheets:`, error);
      }
    } else {
      console.log(`ℹ️ No se buscará en Google Sheets porque buscarEnGoogleSheets=false`);
    }
    
    // Paso 3: Si no se encontraron datos ni en la BD ni en Google Sheets
    return {
      dependencia: params.dependencia,
      periodo: params.periodo,
      categorias: [],
      total: 0,
      origen: 'no_encontrado' as const,
    };
  },

  // Comparar dependencias
  async compararDependencias(params: ConsultaComparativaDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Paso 1: Buscar en la base de datos primero
    console.log(`🔍 Buscando datos para comparación en período ${params.periodo} en la base de datos...`);
    
    const resultados = await repository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd')
      .where('d.nombre IN (:...dependencias)', { dependencias: params.dependencias })
      .andWhere('e.periodo = :periodo', { periodo: params.periodo })
      .orderBy('d.nombre')
      .getMany();
    
    // Si encontramos todos los datos necesarios en la BD, los retornamos
    if (resultados.length === params.dependencias.length) {
      console.log(`✅ Encontrados ${resultados.length} resultados en BD`);
      
      return {
        periodo: params.periodo,
        comparacion: resultados.map(e => ({
          dependencia: e.dependencia.nombre,
          expedientesExistentes: e.expedientesExistentes,
          expedientesRecibidos: e.expedientesRecibidos,
          expedientesReingresados: e.expedientesReingresados,
          categoriasDetalle: params.metricas.includes('categorias') ? e.categoriasDetalle : undefined,
          fechaEstadistica: e.fechaEstadistica,
        })),
        total: resultados.length,
        origen: 'base_datos' as const,
      };
    }
    
    // Si faltan dependencias y podemos buscar en Google Sheets
    if (resultados.length < params.dependencias.length && params.buscarEnGoogleSheets) {
      console.log(`⚠️ Solo se encontraron ${resultados.length} de ${params.dependencias.length} dependencias en BD. Buscando en Google Sheets...`);
      
      // Identificar qué dependencias faltan
      const dependenciasEncontradas = resultados.map(e => e.dependencia.nombre);
      const dependenciasFaltantes = params.dependencias.filter(d => !dependenciasEncontradas.includes(d));
      
      console.log(`🔍 Buscando ${dependenciasFaltantes.length} dependencias faltantes en Google Sheets: ${dependenciasFaltantes.join(', ')}`);
      
      try {
        // Importar el servicio de Google Sheets
        const { googleSheetsService } = await import('./google.sheets.service');
        
        // Verificar que el servicio esté disponible
        if (!googleSheetsService.isAvailable()) {
          console.warn(`⚠️ Google Sheets service no está disponible`);
          throw new Error('Google Sheets service no está disponible');
        }
        
        // Verificar si hay sheets disponibles
        const availableSheets = await googleSheetsService.listAvailableSheets();
        
        // Resultados adicionales de Google Sheets
        const resultadosAdicionales = [];
        
        // Para cada dependencia faltante, buscar en Google Sheets
        for (const dependencia of dependenciasFaltantes) {
          let encontrado = false;
          
          // Explorar las hojas en busca de datos
          for (const sheet of availableSheets) {
            try {
              // Intentamos extraer datos de esta hoja
              const estadisticas = await googleSheetsService.extractSheetData(sheet.name);
              
              // Buscar la estadística específica
              const estadisticaGS = estadisticas.find(e => 
                e.dependencia === dependencia && 
                e.periodo === params.periodo
              );
              
              if (estadisticaGS) {
                console.log(`✅ Datos encontrados en Google Sheets para ${dependencia} (sheet: ${sheet.name})`);
                
                // Añadir a resultados
                resultadosAdicionales.push({
                  dependencia: estadisticaGS.dependencia,
                  expedientesExistentes: estadisticaGS.expedientesExistentes,
                  expedientesRecibidos: estadisticaGS.expedientesRecibidos,
                  expedientesReingresados: estadisticaGS.expedientesReingresados,
                  categoriasDetalle: params.metricas.includes('categorias') ? estadisticaGS.categoriasDetalle : undefined,
                  fechaEstadistica: estadisticaGS.fechaEstadistica,
                });
                
                encontrado = true;
                
                // Guardar en la base de datos
                console.log(`💾 Guardando datos encontrados en Google Sheets a la base de datos...`);
                await googleSheetsService.saveEstadisticaToDatabase(estadisticaGS);
                
                break;
              }
            } catch (error) {
              console.warn(`⚠️ Error procesando hoja ${sheet.name}:`, error);
              continue;
            }
          }
          
          if (!encontrado) {
            console.warn(`⚠️ No se encontraron datos en Google Sheets para ${dependencia}`);
            // Añadir con valores vacíos
            resultadosAdicionales.push({
              dependencia,
              expedientesExistentes: 0,
              expedientesRecibidos: 0,
              expedientesReingresados: 0,
              categoriasDetalle: {},
              fechaEstadistica: new Date(),
            });
          }
        }
        
        // Combinar resultados
        const todosResultados = [
          ...resultados.map(e => ({
            dependencia: e.dependencia.nombre,
            expedientesExistentes: e.expedientesExistentes,
            expedientesRecibidos: e.expedientesRecibidos,
            expedientesReingresados: e.expedientesReingresados,
            categoriasDetalle: params.metricas.includes('categorias') ? e.categoriasDetalle : undefined,
            fechaEstadistica: e.fechaEstadistica,
          })),
          ...resultadosAdicionales
        ];
        
        return {
          periodo: params.periodo,
          comparacion: todosResultados,
          total: todosResultados.length,
          origen: 'combinado' as const,
        };
        
      } catch (error) {
        console.error(`❌ Error buscando en Google Sheets:`, error);
      }
    } else if (resultados.length < params.dependencias.length) {
      console.log(`⚠️ Solo se encontraron ${resultados.length} de ${params.dependencias.length} dependencias en BD, pero no se buscará en Google Sheets porque buscarEnGoogleSheets=false`);
    }
    
    // Retornar los resultados de la BD (completos o incompletos)
    return {
      periodo: params.periodo,
      comparacion: resultados.map(e => ({
        dependencia: e.dependencia.nombre,
        expedientesExistentes: e.expedientesExistentes,
        expedientesRecibidos: e.expedientesRecibidos,
        expedientesReingresados: e.expedientesReingresados,
        categoriasDetalle: params.metricas.includes('categorias') ? e.categoriasDetalle : undefined,
        fechaEstadistica: e.fechaEstadistica,
      })),
      total: resultados.length,
      origen: 'base_datos_incompleto' as const,
    };
  },

  // Obtener evolución temporal
  async getEvolucion(params: EvolucionTemporalDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Paso 1: Buscar en la base de datos primero
    console.log(`🔍 Buscando datos de evolución para el período ${params.periodoInicio} a ${params.periodoFin} en la base de datos...`);
    
    // Si hay un objeto de juicio específico, mostrar en logs
    if (params.objetoJuicio) {
      console.log(`🔍 Filtrando por objeto de juicio específico: ${params.objetoJuicio}`);
    }
    
    let query = repository.createQueryBuilder('e')
      .select([
        'e.periodo as periodo',
        `SUM(e.expedientes${params.metrica.charAt(0).toUpperCase() + params.metrica.slice(1)}) as valor`,
        'COUNT(*) as numeroDependencias'
      ])
      .where('e.periodo BETWEEN :inicio AND :fin', { 
        inicio: params.periodoInicio, 
        fin: params.periodoFin 
      });
    
    if (params.dependencias && params.dependencias.length > 0) {
      query = query.leftJoin('e.dependencia', 'd')
        .andWhere('d.nombre IN (:...dependencias)', { dependencias: params.dependencias });
    }
    
    // Si se especifica un objeto de juicio específico, filtrar por él
    if (params.objetoJuicio && params.objetoJuicio !== 'TODOS') {
      console.log(`🔍 Aplicando filtro por objeto de juicio: ${params.objetoJuicio}`);
      // Usamos JSON_CONTAINS para buscar en el objeto JSON categoriasDetalle
      query = query.andWhere(`JSON_EXTRACT(e.categoriasDetalle, '$."${params.objetoJuicio}"') IS NOT NULL`);
    }
    
    query = query.groupBy('e.periodo').orderBy('e.periodo');
    
    const resultados = await query.getRawMany();
    
    // Si encontramos datos en la BD, los retornamos inmediatamente
    if (resultados.length > 0) {
      console.log(`✅ Se encontraron ${resultados.length} registros de evolución en la base de datos`);
      return {
        metrica: params.metrica,
        periodoInicio: params.periodoInicio,
        periodoFin: params.periodoFin,
        evolucion: resultados,
        total: resultados.length,
        origen: 'base_datos' as const
      };
    }
    
    // Paso 2: Si no hay datos en BD y se permite buscar en Google Sheets, intentamos ahí
    if (params.buscarEnGoogleSheets) {
      console.log(`🔍 No se encontraron datos en la BD. Intentando buscar en Google Sheets...`);
      
      try {
        // Importar el servicio de Google Sheets
        const { googleSheetsService } = await import('./google.sheets.service');
        
        // Verificar que el servicio esté disponible
        if (!googleSheetsService.isAvailable()) {
          console.warn(`⚠️ Google Sheets service no está disponible`);
          throw new Error('Google Sheets service no está disponible');
        }
        
        // Verificar si hay sheets disponibles que puedan tener la información
        const availableSheets = await googleSheetsService.listAvailableSheets();
        
        // Aquí implementaríamos la lógica específica para extraer datos de evolución de Google Sheets
        // Por ahora, vamos a simular el proceso basándonos en los datos disponibles
        
        const evolucionGSResults = [];
        const periodsToCheck = this.generatePeriodRange(params.periodoInicio, params.periodoFin);
        
        console.log(`📊 Buscando datos para ${periodsToCheck.length} períodos en Google Sheets...`);
        
        // Para cada período y cada dependencia, buscar datos
        for (const periodo of periodsToCheck) {
          let totalValor = 0;
          let dependenciasEncontradas = 0;
          
          // Si hay dependencias específicas, buscar solo esas
          if (params.dependencias && params.dependencias.length > 0) {
            for (const dependencia of params.dependencias) {
              // Buscar en cada hoja disponible
              for (const sheet of availableSheets) {
                try {
                  const estadisticas = await googleSheetsService.extractSheetData(sheet.name);
                  
                  // Buscar estadística para esta dependencia y período
                  const estadisticaGS = estadisticas.find(e => 
                    e.dependencia === dependencia && e.periodo === periodo
                  );
                  
                  if (estadisticaGS) {
                    // Si hay un objeto de juicio específico, verificar si existe en las categorías
                  if (params.objetoJuicio && params.objetoJuicio !== 'TODOS' && 
                      (!estadisticaGS.categoriasDetalle || !estadisticaGS.categoriasDetalle[params.objetoJuicio])) {
                    // Si no existe ese objeto de juicio en las categorías, saltamos esta estadística
                    console.log(`⚠️ Saltando estadística para ${dependencia} - ${periodo} porque no contiene el objeto de juicio ${params.objetoJuicio}`);
                    continue;
                  }
                  
                  // Extraer el valor según la métrica
                  let valor = 0;
                  
                  // Si hay un objeto de juicio específico, usamos sus valores en lugar del total
                  if (params.objetoJuicio && params.objetoJuicio !== 'TODOS' && estadisticaGS.categoriasDetalle) {
                    const categoria = estadisticaGS.categoriasDetalle[params.objetoJuicio];
                    if (categoria) {
                      switch (params.metrica) {
                        case 'existentes':
                          // Para existentes en un objeto de juicio, usamos el total
                          valor = categoria.asignados + categoria.reingresados;
                          break;
                        case 'recibidos':
                          valor = categoria.asignados;
                          break;
                        case 'reingresados':
                          valor = categoria.reingresados;
                          break;
                      }
                    }
                  } else {
                    // Si no hay filtro de objeto de juicio, usamos los totales normales
                    switch (params.metrica) {
                      case 'existentes':
                        valor = estadisticaGS.expedientesExistentes || 0;
                        break;
                      case 'recibidos':
                        valor = estadisticaGS.expedientesRecibidos || 0;
                        break;
                      case 'reingresados':
                        valor = estadisticaGS.expedientesReingresados || 0;
                        break;
                    }
                  }
                  
                  totalValor += valor;
                  dependenciasEncontradas++;
                    
                    console.log(`✅ Datos encontrados en GS para ${dependencia}, período ${periodo}: ${params.metrica}=${valor}`);
                    
                    // Guardar en la base de datos para futuras consultas
                    await googleSheetsService.saveEstadisticaToDatabase(estadisticaGS);
                    
                    break; // Salir del bucle de hojas una vez encontrado
                  }
                } catch (error) {
                  console.warn(`⚠️ Error procesando hoja ${sheet.name}:`, error);
                  continue;
                }
              }
            }
          } else {
            // Si no hay dependencias específicas, buscar todas las disponibles para el período
            for (const sheet of availableSheets) {
              try {
                const estadisticas = await googleSheetsService.extractSheetData(sheet.name);
                
                // Filtrar por período
                const estadisticasDelPeriodo = estadisticas.filter(e => e.periodo === periodo);
                
                for (const estadisticaGS of estadisticasDelPeriodo) {
                  // Si hay un objeto de juicio específico, verificar si existe en las categorías
                  if (params.objetoJuicio && params.objetoJuicio !== 'TODOS' && 
                      (!estadisticaGS.categoriasDetalle || !estadisticaGS.categoriasDetalle[params.objetoJuicio])) {
                    // Si no existe ese objeto de juicio en las categorías, saltamos esta estadística
                    continue;
                  }
                  
                  // Extraer el valor según la métrica
                  let valor = 0;
                  
                  // Si hay un objeto de juicio específico, usamos sus valores en lugar del total
                  if (params.objetoJuicio && params.objetoJuicio !== 'TODOS' && estadisticaGS.categoriasDetalle) {
                    const categoria = estadisticaGS.categoriasDetalle[params.objetoJuicio];
                    if (categoria) {
                      switch (params.metrica) {
                        case 'existentes':
                          // Para existentes en un objeto de juicio, usamos el total
                          valor = categoria.asignados + categoria.reingresados;
                          break;
                        case 'recibidos':
                          valor = categoria.asignados;
                          break;
                        case 'reingresados':
                          valor = categoria.reingresados;
                          break;
                      }
                    }
                  } else {
                    // Si no hay filtro de objeto de juicio, usamos los totales normales
                    switch (params.metrica) {
                      case 'existentes':
                        valor = estadisticaGS.expedientesExistentes || 0;
                        break;
                      case 'recibidos':
                        valor = estadisticaGS.expedientesRecibidos || 0;
                        break;
                      case 'reingresados':
                        valor = estadisticaGS.expedientesReingresados || 0;
                        break;
                    }
                  }
                  
                  totalValor += valor;
                  dependenciasEncontradas++;
                  
                  // Guardar en la base de datos para futuras consultas
                  await googleSheetsService.saveEstadisticaToDatabase(estadisticaGS);
                }
              } catch (error) {
                console.warn(`⚠️ Error procesando hoja ${sheet.name}:`, error);
                continue;
              }
            }
          }
          
          // Si encontramos datos para este período, agregarlo al resultado
          if (dependenciasEncontradas > 0) {
            evolucionGSResults.push({
              periodo,
              valor: totalValor,
              numeroDependencias: dependenciasEncontradas
            });
            console.log(`📊 Período ${periodo}: ${totalValor} (${dependenciasEncontradas} dependencias)`);
          }
        }
        
        // Si encontramos datos en Google Sheets, retornarlos
        if (evolucionGSResults.length > 0) {
          console.log(`✅ Se encontraron datos de evolución en Google Sheets para ${evolucionGSResults.length} períodos`);
          return {
            metrica: params.metrica,
            periodoInicio: params.periodoInicio,
            periodoFin: params.periodoFin,
            evolucion: evolucionGSResults,
            total: evolucionGSResults.length,
            origen: 'google_sheets' as const
          };
        }
        
        console.log(`⚠️ No se encontraron datos en Google Sheets`);
      } catch (error) {
        console.error(`❌ Error buscando en Google Sheets:`, error);
      }
    } else {
      console.log(`ℹ️ No se buscará en Google Sheets porque buscarEnGoogleSheets=false`);
    }
    
    // Paso 3: Si no se encontraron datos en ninguna fuente, retornar vacío
    return {
      metrica: params.metrica,
      periodoInicio: params.periodoInicio,
      periodoFin: params.periodoFin,
      evolucion: [],
      total: 0,
      origen: 'no_encontrado' as const,
    };
  },
  
  // Generar rango de períodos entre inicio y fin (formato YYYYMM)
  generatePeriodRange(inicio: string, fin: string): string[] {
    const periodos: string[] = [];
    
    let currentYear = parseInt(inicio.substring(0, 4));
    let currentMonth = parseInt(inicio.substring(4, 6));
    
    const endYear = parseInt(fin.substring(0, 4));
    const endMonth = parseInt(fin.substring(4, 6));
    
    while (
      currentYear < endYear || 
      (currentYear === endYear && currentMonth <= endMonth)
    ) {
      periodos.push(`${currentYear}${currentMonth.toString().padStart(2, '0')}`);
      
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
    
    return periodos;
  },

  // Obtener top dependencias
  async getTopDependencias(params: TopDependenciasDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    const resultados = await repository.createQueryBuilder('e')
      .select([
        'd.nombre as dependencia',
        `e.expedientes${params.metrica.charAt(0).toUpperCase() + params.metrica.slice(1)} as valor`,
        'e.expedientesExistentes',
        'e.expedientesRecibidos',
        'e.expedientesReingresados'
      ])
      .leftJoin('e.dependencia', 'd')
      .where('e.periodo = :periodo', { periodo: params.periodo })
      .orderBy(`e.expedientes${params.metrica.charAt(0).toUpperCase() + params.metrica.slice(1)}`, params.orden.toUpperCase() as any)
      .limit(params.limite)
      .getRawMany();
    
    return {
      periodo: params.periodo,
      metrica: params.metrica,
      orden: params.orden,
      dependencias: resultados,
      total: resultados.length,
    };
  },

  // Obtener datos para timeline
  async getTimelineData(params: EvolucionTemporalDTO) {
    // Por ahora, reutilizamos la lógica de evolución
    return this.getEvolucion(params);
  },

  // Obtener datos del dashboard
  async getDashboard(params: DashboardResumenDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Datos actuales
    const datosActuales = await repository.createQueryBuilder('e')
      .select([
        'COUNT(*) as totalDependencias',
        'SUM(e.expedientesExistentes) as totalExistentes',
        'SUM(e.expedientesRecibidos) as totalRecibidos',
        'SUM(e.expedientesReingresados) as totalReingresados',
        'AVG(e.expedientesExistentes) as promedioExistentes',
        'MAX(e.expedientesExistentes) as maximoExistentes',
        'MIN(e.expedientesExistentes) as minimoExistentes'
      ])
      .where('e.periodo = :periodo', { periodo: params.periodo })
      .getRawOne();
    
    let datosAnteriores = null;
    let crecimiento = null;
    
    if (params.compararConAnterior) {
      const periodoAnterior = this.getPeriodoAnterior(params.periodo);
      
      datosAnteriores = await repository.createQueryBuilder('e')
        .select([
          'COUNT(*) as totalDependencias',
          'SUM(e.expedientesExistentes) as totalExistentes',
          'SUM(e.expedientesRecibidos) as totalRecibidos',
          'SUM(e.expedientesReingresados) as totalReingresados'
        ])
        .where('e.periodo = :periodo', { periodo: periodoAnterior })
        .getRawOne();
      
      if (datosAnteriores) {
        crecimiento = {
          dependencias: this.calcularPorcentajeCrecimiento(datosActuales.totalDependencias, datosAnteriores.totalDependencias),
          existentes: this.calcularPorcentajeCrecimiento(datosActuales.totalExistentes, datosAnteriores.totalExistentes),
          recibidos: this.calcularPorcentajeCrecimiento(datosActuales.totalRecibidos, datosAnteriores.totalRecibidos),
          reingresados: this.calcularPorcentajeCrecimiento(datosActuales.totalReingresados, datosAnteriores.totalReingresados),
        };
      }
    }
    
    return {
      periodo: params.periodo,
      actual: datosActuales,
      anterior: datosAnteriores,
      crecimiento,
    };
  },

  // Sincronizar datos desde Google Sheets hacia la base de datos
  async sincronizar(params: SincronizacionDTO) {
    try {
      console.log('🔄 Iniciando sincronización desde Google Sheets...');
      
      // Delegar la sincronización al SyncService que es el orquestador principal
      const { SyncService } = await import('./sync.service');
      const syncService = new SyncService();

      let resultado;
      
      if (params.sheetIds && params.sheetIds.length > 0) {
        // Si se especifican hojas específicas, procesarlas una por una
        console.log(`📊 Sincronizando hojas específicas: ${params.sheetIds.join(', ')}`);
        console.warn(`⚠️ La sincronización de hojas específicas no está implementada. Ejecutando sincronización completa...`);
        
        // TODO: Implementar sincronización de hojas específicas
        const syncResult = await syncService.syncFromSheet();
        
        resultado = {
          procesados: syncResult.details?.total || 0,
          insertados: syncResult.details?.inserted || 0,
          actualizados: syncResult.details?.updated || 0,
          errores: syncResult.details?.errors || []
        };
      } else {
        // Sincronización completa
        console.log('� Ejecutando sincronización completa...');
        const syncResult = await syncService.syncFromSheet();
        
        if (syncResult.success && syncResult.details) {
          resultado = {
            procesados: syncResult.details.total || 0,
            insertados: syncResult.details.success || 0,
            actualizados: 0,
            errores: syncResult.details.results
              ? syncResult.details.results.filter((r: any) => !r.success).map((r: any) => r.error || 'Error desconocido')
              : []
          };
        } else {
          throw new Error(syncResult.message || 'Error en la sincronización');
        }
      }

      console.log(`\n📊 SINCRONIZACIÓN COMPLETADA:`);
      console.log(`  ✓ Total procesados: ${resultado.procesados}`);
      console.log(`  ✓ Insertados: ${resultado.insertados}`);
      console.log(`  ✓ Actualizados: ${resultado.actualizados}`);
      console.log(`  ${resultado.errores.length > 0 ? '⚠️' : '✓'} Errores: ${resultado.errores.length}`);

      if (resultado.errores.length > 0) {
        console.warn('\n⚠️ Errores encontrados durante la sincronización:');
        resultado.errores.slice(0, 5).forEach((err: string, i: number) => {
          console.warn(`  ${i + 1}. ${err}`);
        });
        
        if (resultado.errores.length > 5) {
          console.warn(`  ... y ${resultado.errores.length - 5} errores más`);
        }
      }

      return {
        mensaje: 'Sincronización desde Google Sheets completada',
        registrosProcesados: resultado.procesados,
        registrosInsertados: resultado.insertados,
        registrosActualizados: resultado.actualizados,
        errores: resultado.errores,
        parametros: params,
        estado: resultado.errores.length === 0 ? 'completado' : 'completado_con_errores',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
      return {
        mensaje: 'Error en la sincronización',
        error: error instanceof Error ? error.message : String(error),
        parametros: params,
        estado: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  },

  // Obtener períodos disponibles
  async getPeriodosDisponibles() {
    console.log('🔍 Obteniendo períodos disponibles...');
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Obtener períodos de la base de datos
    const periodos = await repository.createQueryBuilder('e')
      .select('DISTINCT e.periodo', 'periodo')
      .orderBy('e.periodo', 'DESC')
      .getRawMany();
    
    const dbPeriodos = periodos.map(p => p.periodo);
    console.log(`📅 Períodos encontrados en BD: ${dbPeriodos.length}`);
    
    // Si hay muy pocos períodos en la BD (menos de 3), intentar buscar en Google Sheets
    if (dbPeriodos.length < 3) {
      try {
        console.log('🔍 Buscando períodos adicionales en Google Sheets...');
        
        // Importar el servicio de Google Sheets
        const { googleSheetsService } = await import('./google.sheets.service');
        
        // Verificar que el servicio esté disponible
        if (googleSheetsService.isAvailable()) {
          // Listar hojas disponibles
          const sheets = await googleSheetsService.listAvailableSheets();
          
          // Extraer períodos de los nombres de las hojas
          // Buscar patrones como "202402" o "2024-02" en los nombres de las hojas
          const sheetPeriods = sheets
            .map(sheet => {
              const matches = sheet.name.match(/(\d{4})[-_]?(\d{2})/);
              if (matches && matches.length >= 3) {
                return `${matches[1]}${matches[2]}`;
              }
              return null;
            })
            .filter(Boolean) as string[];
          
          console.log(`📅 Períodos encontrados en Google Sheets: ${sheetPeriods.length}`);
          
          // Combinar y eliminar duplicados
          const allPeriodos = [...new Set([...dbPeriodos, ...sheetPeriods])];
          
          // Ordenar de más reciente a más antiguo
          allPeriodos.sort((a, b) => b.localeCompare(a));
          
          console.log(`📅 Total períodos combinados: ${allPeriodos.length}`);
          
          return {
            periodos: allPeriodos,
            total: allPeriodos.length,
            fuente: 'combinado'
          };
        }
      } catch (error) {
        console.warn('⚠️ Error buscando períodos en Google Sheets:', error);
        // Si hay error, continuar con los períodos de la BD
      }
    }
    
    return {
      periodos: dbPeriodos,
      total: dbPeriodos.length,
      fuente: 'base_datos'
    };
  },

  // Obtener dependencias disponibles
  async getDependenciasDisponibles() {
    const repository = AppDataSource.getRepository(Dependencia);
    
    const dependencias = await repository.find({
      where: { activa: true },
      order: { nombre: 'ASC' },
    });
    
    return {
      dependencias: dependencias.map(d => ({
        id: d.id,
        nombre: d.nombre,
        codigo: d.codigo,
        tipo: d.tipo,
        jurisdiccion: d.jurisdiccion,
      })),
      total: dependencias.length,
    };
  },

  // Obtener objetos de juicio disponibles
  async getObjetosJuicioDisponibles() {
    const repository = AppDataSource.getRepository(Estadistica);
    
    // Obtener estadísticas recientes con categoriasDetalle
    const estadisticas = await repository.createQueryBuilder('e')
      .where('e.categoriasDetalle IS NOT NULL')
      .orderBy('e.periodo', 'DESC')
      .take(50)
      .getMany();
    
    // Extraer todos los nombres de objetos de juicio únicos
    const objetosJuicioSet = new Set<string>();
    
    estadisticas.forEach(estadistica => {
      if (estadistica.categoriasDetalle) {
        Object.keys(estadistica.categoriasDetalle).forEach(objetoJuicio => {
          objetosJuicioSet.add(objetoJuicio);
        });
      }
    });
    
    // Convertir a array y ordenar alfabéticamente
    const objetosJuicio = Array.from(objetosJuicioSet).sort();
    
    return {
      objetosJuicio,
      total: objetosJuicio.length
    };
  },
  
  // Buscar estadísticas
  async buscar(params: BusquedaDTO) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    let query = repository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd');
    
    if (params.campos.includes('dependencia')) {
      query = query.where('d.nombre LIKE :termino', { termino: `%${params.termino}%` });
    }
    
    if (params.campos.includes('periodo')) {
      query = query.orWhere('e.periodo LIKE :termino', { termino: `%${params.termino}%` });
    }
    
    const resultados = await query
      .skip(params.offset)
      .take(params.limite)
      .getMany();
    
    const total = await query.getCount();
    
    return {
      termino: params.termino,
      resultados: resultados.map(e => ({
        id: e.id,
        dependencia: e.dependencia.nombre,
        periodo: e.periodo,
        expedientesExistentes: e.expedientesExistentes,
        expedientesRecibidos: e.expedientesRecibidos,
        expedientesReingresados: e.expedientesReingresados,
      })),
      total,
      pagina: Math.floor(params.offset / params.limite) + 1,
      totalPaginas: Math.ceil(total / params.limite),
    };
  },

  // Funciones helper
  getPeriodoAnterior(periodo: string): string {
    const fecha = new Date(parseInt(periodo.substr(0, 4)), parseInt(periodo.substr(4, 2)) - 1, 1);
    fecha.setMonth(fecha.getMonth() - 1);
    
    const ano = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    
    return `${ano}${mes}`;
  },

  calcularPorcentajeCrecimiento(actual: number, anterior: number): number {
    if (anterior === 0) return actual > 0 ? 100 : 0;
    return Math.round(((actual - anterior) / anterior) * 100 * 100) / 100;
  },

  // =============================
  // NUEVOS MÉTODOS PARA FRONTEND
  // =============================
  
  // Obtener evolución temporal específica para frontend
  async getEvolucionFrontend(dependenciaId: number) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    console.log(`🔍 Obteniendo evolución para dependencia ID: ${dependenciaId}`);
    
    const resultados = await repository.createQueryBuilder('e')
      .select([
        'e.periodo as periodo',
        'e.expedientesExistentes as valorMetrica'
      ])
      .where('e.dependenciaId = :dependenciaId', { dependenciaId })
      .orderBy('e.periodo', 'ASC')
      .getRawMany();
    
    console.log(`✅ Se encontraron ${resultados.length} registros de evolución`);
    
    return resultados.map(r => ({
      periodo: r.periodo,
      valorMetrica: r.valorMetrica || 0
    }));
  },

  // Obtener comparativa específica para frontend
  async getComparativaFrontend(dependenciaIds: number[], anio: number, mes: number) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    const periodo = `${anio}${mes.toString().padStart(2, '0')}`;
    console.log(`🔍 Obteniendo comparativa para período ${periodo} y dependencias: ${dependenciaIds.join(', ')}`);
    
    const resultados = await repository.createQueryBuilder('e')
      .select([
        'd.nombre as dependenciaNombre',
        'e.expedientesExistentes as valorMetrica'
      ])
      .leftJoin('e.dependencia', 'd')
      .where('e.dependenciaId IN (:...dependenciaIds)', { dependenciaIds })
      .andWhere('e.periodo = :periodo', { periodo })
      .orderBy('d.nombre', 'ASC')
      .getRawMany();
    
    console.log(`✅ Se encontraron ${resultados.length} resultados de comparativa`);
    
    return resultados.map(r => ({
      dependenciaNombre: r.dependenciaNombre,
      valorMetrica: r.valorMetrica || 0
    }));
  },

  // Obtener reporte individual complejo para frontend
  async getReporteIndividualFrontend(dependenciaId: number, anio: number, mes: number) {
    const estadisticaRepository = AppDataSource.getRepository(Estadistica);
    const { EstadisticaTipoCaso } = await import('../database/entities/EstadisticaTipoCaso');
    const estadisticaTipoCasoRepository = AppDataSource.getRepository(EstadisticaTipoCaso);
    
    const periodo = `${anio}${mes.toString().padStart(2, '0')}`;
    console.log(`🔍 Obteniendo reporte individual para dependencia ID: ${dependenciaId}, período: ${periodo}`);
    
    // 1. Obtener estadística principal (totales)
    const estadisticaPrincipal = await estadisticaRepository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd')
      .where('e.dependenciaId = :dependenciaId', { dependenciaId })
      .andWhere('e.periodo = :periodo', { periodo })
      .getOne();
    
    if (!estadisticaPrincipal) {
      console.log(`⚠️ No se encontró estadística principal para dependencia ${dependenciaId} en período ${periodo}`);
      return null;
    }
    
    // 2. Obtener desglose por tipos de caso
    const desgloseTiposCaso = await estadisticaTipoCasoRepository.createQueryBuilder('etc')
      .select([
        'tc.name as nombre',
        'etc.recibidosAsignados as asignados',
        'etc.reingresados as reingresados',
        'etc.existentes as existentes',
        'etc.total as total'
      ])
      .leftJoin('etc.tipoCaso', 'tc')
      .where('etc.estadisticaId = :estadisticaId', { estadisticaId: estadisticaPrincipal.id })
      .orderBy('etc.total', 'DESC')
      .getRawMany();
    
    // 3. Si no hay datos en EstadisticaTipoCaso, usar categoriasDetalle de Estadistica
    let tiposDeCaso: Array<{
      nombre: string;
      asignados: number;
      reingresados: number;
      existentes: number;
      total: number;
    }> = [];
    
    if (desgloseTiposCaso.length > 0) {
      tiposDeCaso = desgloseTiposCaso.map(d => ({
        nombre: d.nombre,
        asignados: d.asignados || 0,
        reingresados: d.reingresados || 0,
        existentes: d.existentes || 0,
        total: d.total || 0
      }));
    } else if (estadisticaPrincipal.categoriasDetalle) {
      // Usar categoriasDetalle como fallback
      tiposDeCaso = Object.entries(estadisticaPrincipal.categoriasDetalle).map(([nombre, datos]) => ({
        nombre,
        asignados: datos.asignados || 0,
        reingresados: datos.reingresados || 0,
        existentes: 0, // No disponible en categoriasDetalle
        total: (datos.asignados || 0) + (datos.reingresados || 0)
      })).sort((a, b) => b.total - a.total);
    }
    
    console.log(`✅ Reporte individual completado: ${tiposDeCaso.length} tipos de caso encontrados`);
    
    // 4. Ensamblar el objeto de respuesta complejo
    return {
      dependencia: estadisticaPrincipal.dependencia.nombre,
      periodo: estadisticaPrincipal.periodo,
      fechaEstadistica: estadisticaPrincipal.fechaEstadistica?.toISOString()?.split('T')[0],
      
      // Totales generales
      expedientesExistentes: estadisticaPrincipal.expedientesExistentes || 0,
      expedientesRecibidos: estadisticaPrincipal.expedientesRecibidos || 0,
      expedientesReingresados: estadisticaPrincipal.expedientesReingresados || 0,
      
      // Desglose por tipos de caso
      tiposDeCaso,
      
      // Métricas adicionales
      totalTiposCaso: tiposDeCaso.length,
      totalDesglosado: tiposDeCaso.reduce((sum, tipo) => sum + tipo.total, 0),
      
      // Metadatos
      metadatos: estadisticaPrincipal.metadatos || {},
      ultimaActualizacion: estadisticaPrincipal.updatedAt?.toISOString()
    };
  },

  // Nuevos métodos para el frontend

  // Evolución de una dependencia específica
  async getEvolucionDependencia(dependenciaId: number) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    console.log(`🔍 Obteniendo evolución para dependencia ${dependenciaId}...`);
    
    const estadisticas = await repository.createQueryBuilder('e')
      .select([
        'e.periodo as periodo',
        'e.expedientesExistentes as valorMetrica'
      ])
      .where('e.dependenciaId = :dependenciaId', { dependenciaId })
      .orderBy('e.periodo', 'ASC')
      .getRawMany();
    
    console.log(`✅ Encontrados ${estadisticas.length} registros de evolución`);
    
    return estadisticas.map(e => ({
      periodo: e.periodo,
      valorMetrica: e.valorMetrica || 0
    }));
  },

  // Comparativa de múltiples dependencias para un período específico
  async getComparativaDependencias(dependenciaIds: number[], anio: number, mes: number) {
    const repository = AppDataSource.getRepository(Estadistica);
    
    console.log(`🔍 Obteniendo comparativa para ${dependenciaIds.length} dependencias en ${anio}-${mes.toString().padStart(2, '0')}...`);
    
    // Usar campos anio/mes para consulta más eficiente
    const resultados = await repository.createQueryBuilder('e')
      .select([
        'd.nombre as dependenciaNombre',
        'e.expedientesExistentes as valorMetrica'
      ])
      .leftJoin('e.dependencia', 'd')
      .where('e.dependenciaId IN (:...dependenciaIds)', { dependenciaIds })
      .andWhere('e.anio = :anio', { anio })
      .andWhere('e.mes = :mes', { mes })
      .orderBy('d.nombre', 'ASC')
      .getRawMany();
    
    console.log(`✅ Encontrados ${resultados.length} registros de comparativa`);
    
    return resultados.map(r => ({
      dependenciaNombre: r.dependenciaNombre,
      valorMetrica: r.valorMetrica || 0
    }));
  },

  // Reporte individual completo con totales y desglose por tipos de caso
  async getReporteIndividualCompleto(dependenciaId: number, anio: number, mes: number) {
    console.log(`🔍 Obteniendo reporte individual para dependencia ${dependenciaId} en ${anio}-${mes.toString().padStart(2, '0')}...`);
    
    // 1. Obtener totales de la estadística principal usando anio/mes para eficiencia
    const estadisticaRepository = AppDataSource.getRepository(Estadistica);
    const estadistica = await estadisticaRepository.createQueryBuilder('e')
      .leftJoinAndSelect('e.dependencia', 'd')
      .where('e.dependenciaId = :dependenciaId', { dependenciaId })
      .andWhere('e.anio = :anio', { anio })
      .andWhere('e.mes = :mes', { mes })
      .getOne();
    
    if (!estadistica) {
      console.warn(`⚠️ No se encontró estadística para dependencia ${dependenciaId} en ${anio}-${mes.toString().padStart(2, '0')}`);
      throw new Error(`No se encontraron datos para la dependencia en el período ${anio}-${mes.toString().padStart(2, '0')}`);
    }

    // 2. Priorizar EstadisticaTipoCaso sobre categoriasDetalle
    let tiposDeCaso: Array<{
      nombre: string;
      asignados: number;
      reingresados: number;
      existentes: number;
      resueltos: number;
      pendientes: number;
    }> = [];

    try {
      // Usar método mejorado de la entidad
      const tiposCasoEstructurados = await estadistica.getTiposCasoEstructurados();
      tiposDeCaso = tiposCasoEstructurados.map(tc => ({
        nombre: tc.nombre,
        asignados: tc.asignados,
        reingresados: tc.reingresados,
        existentes: tc.existentes,
        resueltos: tc.resueltos,
        pendientes: tc.pendientes
      }));
      
      const tieneEstructuraCompleta = await estadistica.tieneEstructuraCompleta();
      console.log(`📊 Estructura de datos: ${tieneEstructuraCompleta ? 'Completa (EstadisticaTipoCaso)' : 'Legacy (categoriasDetalle)'}`);
      
    } catch (error) {
      console.warn('Error obteniendo tipos de caso estructurados:', error);
    }
    
    console.log(`✅ Reporte individual generado con ${tiposDeCaso.length} tipos de caso`);
    
    // 4. Ensamblar el objeto JSON complejo
    return {
      dependencia: estadistica.dependencia.nombre,
      periodo: estadistica.periodo,
      fecha: estadistica.fechaEstadistica,
      
      // Totales generales
      expedientesExistentes: estadistica.expedientesExistentes,
      expedientesRecibidos: estadistica.expedientesRecibidos,
      expedientesReingresados: estadistica.expedientesReingresados,
      totalExpedientes: estadistica.getTotalExpedientes(),
      
      // Desglose por tipos de caso
      tiposDeCaso,
      
      // Resumen estadístico
      resumen: {
        totalTiposDeCaso: tiposDeCaso.length,
        totalAsignados: tiposDeCaso.reduce((sum, tc) => sum + tc.asignados, 0),
        totalReingresados: tiposDeCaso.reduce((sum, tc) => sum + tc.reingresados, 0),
        totalResueltos: tiposDeCaso.reduce((sum, tc) => sum + tc.resueltos, 0),
        totalPendientes: tiposDeCaso.reduce((sum, tc) => sum + tc.pendientes, 0),
      },
      
      // Metadatos
      metadatos: estadistica.metadatos,
      ultimaActualizacion: estadistica.updatedAt
    };
  },
};