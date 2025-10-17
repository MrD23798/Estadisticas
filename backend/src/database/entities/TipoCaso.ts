import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('tipos_caso')
export class TipoCaso {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true,
    comment: 'Nombre del tipo de caso'
  })
  name!: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Código o abreviatura del tipo de caso'
  })
  codigo?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descripción detallada del tipo de caso'
  })
  descripcion?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Categoría general del tipo de caso'
  })
  categoria?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Si el tipo de caso está activo'
  })
  activo!: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Orden de visualización'
  })
  orden!: number;

  @Column({
    type: 'json',
    nullable: true,
    comment: 'Metadatos adicionales en formato JSON'
  })
  metadatos?: {
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

  // Métodos helper
  getMetadatos(): any {
    try {
      return this.metadatos || {};
    } catch {
      return {};
    }
  }

  setMetadatos(data: any): void {
    this.metadatos = data;
  }

  // Método para normalizar el nombre
  static normalizarNombre(nombre: string): string {
    return nombre
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  // Método para crear slug
  static crearSlug(nombre: string): string {
    return nombre
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '');
  }
}