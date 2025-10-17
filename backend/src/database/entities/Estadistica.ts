import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  Index, 
  CreateDateColumn, 
  UpdateDateColumn, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { Dependencia } from './Dependencia';

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

  // Categorías detalladas en JSON (objetos de juicio)
  @Column({
    type: 'json',
    nullable: true,
    comment: 'Detalle de categorías/objetos de juicio con asignados y reingresados'
  })
  categoriasDetalle?: {
    [categoria: string]: {
      asignados: number;
      reingresados: number;
    };
  };

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

  // Métodos helper
  getTotalExpedientes(): number {
    return this.expedientesExistentes + this.expedientesRecibidos;
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

  // Obtener año y mes del período
  getAno(): number {
    return Math.floor(parseInt(this.periodo) / 100);
  }

  getMes(): number {
    return parseInt(this.periodo) % 100;
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