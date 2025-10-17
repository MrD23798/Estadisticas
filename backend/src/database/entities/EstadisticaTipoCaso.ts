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
import { Estadistica } from './Estadistica';
import { TipoCaso } from './TipoCaso';

@Entity('estadisticas_tipo_caso')
@Index(['estadisticaId', 'tipoCasoId'], { unique: true })
export class EstadisticaTipoCaso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID de la estadística principal'
  })
  estadisticaId!: number;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'ID del tipo de caso'
  })
  tipoCasoId!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos recibidos asignados'
  })
  recibidosAsignados!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos reingresados'
  })
  reingresados!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos existentes al inicio del período'
  })
  existentes!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad total de casos'
  })
  total!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos resueltos'
  })
  resueltos!: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Cantidad de casos pendientes'
  })
  pendientes!: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Porcentaje de resolución'
  })
  porcentajeResolucion!: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Datos adicionales específicos del tipo de caso'
  })
  datosAdicionales?: {
    [key: string]: any;
  };

  @CreateDateColumn({
    comment: 'Fecha de creación del registro'
  })
  createdAt!: Date;

  @UpdateDateColumn({
    comment: 'Fecha de última actualización'
  })
  updatedAt!: Date;

  // Relaciones
  @ManyToOne(() => Estadistica, { eager: false })
  @JoinColumn({ name: 'estadisticaId' })
  estadistica!: Estadistica;

  @ManyToOne(() => TipoCaso, { eager: true })
  @JoinColumn({ name: 'tipoCasoId' })
  tipoCaso!: TipoCaso;

  // Métodos helper
  calcularTotal(): number {
    return this.existentes + this.recibidosAsignados + this.reingresados;
  }

  calcularPorcentajeResolucion(): number {
    const total = this.calcularTotal();
    if (total === 0) return 0;
    return (this.resueltos / total) * 100;
  }

  actualizarPorcentaje(): void {
    this.porcentajeResolucion = this.calcularPorcentajeResolucion();
  }

  getDatosAdicionales(): any {
    try {
      return this.datosAdicionales || {};
    } catch {
      return {};
    }
  }

  setDatosAdicionales(data: any): void {
    this.datosAdicionales = data;
  }

  // Validaciones
  esConsistente(): boolean {
    const calculatedTotal = this.calcularTotal();
    return this.total === calculatedTotal && 
           this.resueltos + this.pendientes === calculatedTotal;
  }

  // Método para sincronizar totales
  sincronizarTotales(): void {
    this.total = this.calcularTotal();
    this.pendientes = this.total - this.resueltos;
    this.actualizarPorcentaje();
  }
}