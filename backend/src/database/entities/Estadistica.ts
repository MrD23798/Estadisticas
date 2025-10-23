import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  Index, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  OneToMany,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Dependencia } from './Dependencia';
import { EstadisticaTipoCaso } from './EstadisticaTipoCaso';

@Entity('estadisticas')
@Index(['dependenciaId', 'periodo'], { unique: true })
export class Estadistica {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'ID único del sheet en Google Sheets'
  })
  @Index()
  sheetId!: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID de la dependencia'
  })
  dependenciaId!: number;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    comment: 'Período en formato YYYYMM (ej: 202402)'
  })
  @Index()
  periodo!: string;

  // Campos denormalizados para consultas de rango más eficientes
  @Column({
    type: 'smallint',
    nullable: false,
    comment: 'Año extraído del período para consultas eficientes'
  })
  @Index()
  anio!: number;

  @Column({
    type: 'tinyint',
    nullable: false,
    comment: 'Mes extraído del período para consultas eficientes'
  })
  @Index()
  mes!: number;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Fecha de la estadística según el documento'
  })
  @Index()
  fechaEstadistica?: Date;

  // Expedientes principales
  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de expedientes existentes'
  })
  expedientesExistentes!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de expedientes recibidos'
  })
  expedientesRecibidos!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de expedientes reingresados'
  })
  expedientesReingresados!: number;

  // Categorías detalladas en JSON (objetos de juicio) - FALLBACK ONLY
  @Column({
    type: 'json',
    nullable: true,
    comment: 'FALLBACK: Detalle de categorías/objetos de juicio. Usar EstadisticaTipoCaso como fuente principal'
  })
  categoriasDetalle?: {
    [categoria: string]: {
      asignados: number;
      reingresados: number;
    };
  };

  // NOTA: Usar preferentemente la relación EstadisticaTipoCaso para datos estructurados
  // categoriasDetalle es solo un fallback para compatibilidad con datos legacy

  // Alias explícito para objetos de juicio (mismo contenido que categoriasDetalle)
  get objetosJuicio(): {
    [objetoJuicio: string]: {
      asignados: number;
      reingresados: number;
    };
  } | undefined {
    return this.categoriasDetalle;
  }

  // Método para obtener objetos de juicio con más cantidad de asignados
  getObjetosJuicioPrincipales(limite: number = 10): Array<{nombre: string, asignados: number, reingresados: number}> {
    if (!this.categoriasDetalle) return [];
    
    return Object.entries(this.categoriasDetalle)
      .map(([nombre, datos]) => ({
        nombre,
        asignados: datos.asignados,
        reingresados: datos.reingresados
      }))
      .sort((a, b) => b.asignados - a.asignados)
      .slice(0, limite);
  }

  // Metadatos adicionales
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadatos adicionales del documento'
  })
  metadatos?: {
    nombreJuez?: string;
    nombreSecretario?: string;
    observaciones?: string;
    fuenteDatos?: 'google_sheets' | 'csv' | 'manual';
    version?: string;
  };

  // Campos de auditoría
  @CreateDateColumn({
    comment: 'Fecha de creación del registro'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: 'Fecha de última actualización'
  })
  updatedAt!: Date;

  // Relación con Dependencia
  @ManyToOne(() => Dependencia, { eager: true })
  @JoinColumn({ name: 'dependenciaId' })
  dependencia!: Dependencia;

  // Relación con EstadisticaTipoCaso (fuente principal de datos de tipos de caso)
  @OneToMany(() => EstadisticaTipoCaso, estadisticaTipoCaso => estadisticaTipoCaso.estadistica, { 
    cascade: true,
    lazy: true 
  })
  estadisticasTipoCaso?: Promise<EstadisticaTipoCaso[]>;

  // Métodos helper
  getTotalExpedientes(): number {
    return this.expedientesExistentes + this.expedientesRecibidos;
  }

  /**
   * Obtiene los tipos de caso desde EstadisticaTipoCaso (fuente principal)
   * Fallback a categoriasDetalle si no hay datos estructurados
   */
  async getTiposCasoEstructurados(): Promise<Array<{
    id: number;
    nombre: string;
    asignados: number;
    reingresados: number;
    existentes: number;
    resueltos: number;
    pendientes: number;
    total: number;
  }>> {
    try {
      // Intentar obtener desde EstadisticaTipoCaso (fuente principal)
      const estadisticasTipoCaso = await this.estadisticasTipoCaso;
      
      if (estadisticasTipoCaso && estadisticasTipoCaso.length > 0) {
        return estadisticasTipoCaso.map(etc => ({
          id: etc.tipoCasoId,
          nombre: etc.tipoCaso.name,
          asignados: etc.recibidosAsignados,
          reingresados: etc.reingresados,
          existentes: etc.existentes,
          resueltos: etc.resueltos,
          pendientes: etc.pendientes,
          total: etc.total
        }));
      }
    } catch (error) {
      console.warn('No se pudieron cargar EstadisticaTipoCaso, usando fallback', error);
    }

    // Fallback a categoriasDetalle para compatibilidad legacy
    if (this.categoriasDetalle) {
      return Object.entries(this.categoriasDetalle).map(([nombre, datos], index) => ({
        id: -index, // ID temporal negativo para datos legacy
        nombre,
        asignados: datos.asignados || 0,
        reingresados: datos.reingresados || 0,
        existentes: 0, // No disponible en categoriasDetalle
        resueltos: 0,  // No disponible en categoriasDetalle
        pendientes: 0, // No disponible en categoriasDetalle
        total: (datos.asignados || 0) + (datos.reingresados || 0)
      }));
    }

    return [];
  }

  /**
   * Determina si esta estadística tiene datos estructurados o solo legacy
   */
  async tieneEstructuraCompleta(): Promise<boolean> {
    try {
      const estadisticasTipoCaso = await this.estadisticasTipoCaso;
      return !!(estadisticasTipoCaso && estadisticasTipoCaso.length > 0);
    } catch {
      return false;
    }
  }

  getCategoriaTotal(tipo: 'asignados' | 'reingresados'): number {
    if (!this.categoriasDetalle) return 0;
    
    return Object.values(this.categoriasDetalle).reduce(
      (total, categoria) => total + categoria[tipo], 
      0
    );
  }

  getCategoriaPorNombre(nombre: string): { asignados: number; reingresados: number } | null {
    if (!this.categoriasDetalle || !this.categoriasDetalle[nombre]) {
      return null;
    }
    return this.categoriasDetalle[nombre];
  }
  
  // Alias para objetos de juicio
  getObjetoJuicioPorNombre(nombre: string): { asignados: number; reingresados: number } | null {
    return this.getCategoriaPorNombre(nombre);
  }

  // Agregar categoría
  agregarCategoria(nombre: string, asignados: number, reingresados: number): void {
    if (!this.categoriasDetalle) {
      this.categoriasDetalle = {};
    }
    
    this.categoriasDetalle[nombre] = { asignados, reingresados };
  }
  
  // Alias para agregar objeto de juicio
  agregarObjetoJuicio(nombre: string, asignados: number, reingresados: number): void {
    this.agregarCategoria(nombre, asignados, reingresados);
  }
  
  // Obtener total de casos por tipo de objeto de juicio
  getTotalPorObjetoJuicio(): Record<string, number> {
    if (!this.categoriasDetalle) return {};
    
    const totales: Record<string, number> = {};
    
    Object.entries(this.categoriasDetalle).forEach(([nombre, datos]) => {
      totales[nombre] = datos.asignados + datos.reingresados;
    });
    
    return totales;
  }

  // Obtener año y mes del período (ahora desde campos denormalizados)
  getAno(): number {
    return this.anio;
  }

  getMes(): number {
    return this.mes;
  }

  // Método para sincronizar período con campos anio/mes
  syncPeriodoFields(): void {
    if (this.periodo && Estadistica.validarPeriodo(this.periodo)) {
      this.anio = Math.floor(parseInt(this.periodo) / 100);
      this.mes = parseInt(this.periodo) % 100;
    }
  }

  // Hook para sincronizar automáticamente antes de guardar
  @BeforeInsert()
  @BeforeUpdate()
  beforeSave(): void {
    this.syncPeriodoFields();
  }

  // Validar período
  static validarPeriodo(periodo: string): boolean {
    const match = periodo.match(/^(\d{4})(\d{2})$/);
    if (!match || !match[1] || !match[2]) return false;
    
    const ano = parseInt(match[1], 10);
    const mes = parseInt(match[2], 10);
    
    return ano >= 2005 && ano <= 2099 && mes >= 1 && mes <= 12;
  }

  // Convertir período a Date
  static periodoToDate(periodo: string): Date | null {
    if (!this.validarPeriodo(periodo)) return null;
    
    const ano = Math.floor(parseInt(periodo) / 100);
    const mes = parseInt(periodo) % 100;
    
    return new Date(ano, mes - 1, 1);
  }

  // Obtener período anterior
  static periodoAnterior(periodo: string): string {
    const date = this.periodoToDate(periodo);
    if (!date) return periodo;
    
    date.setMonth(date.getMonth() - 1);
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${ano}${mes}`;
  }

  // Obtener período siguiente
  static periodoSiguiente(periodo: string): string {
    const date = this.periodoToDate(periodo);
    if (!date) return periodo;
    
    date.setMonth(date.getMonth() + 1);
    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    
    return `${ano}${mes}`;
  }
}