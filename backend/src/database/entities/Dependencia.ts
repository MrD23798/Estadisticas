import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('dependencias')
export class Dependencia {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    unique: true,
    comment: 'Nombre completo de la dependencia judicial'
  })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Código o identificador corto de la dependencia'
  })
  codigo?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nombre de la hoja de Google Sheets correspondiente'
  })
  sheetName?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Tipo de dependencia (Cámara, Juzgado, etc.)'
  })
  tipo?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Jurisdicción o región'
  })
  jurisdiccion?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Si la dependencia está activa'
  })
  activa!: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Información adicional en formato JSON'
  })
  metadatos?: string;

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
      return this.metadatos ? JSON.parse(this.metadatos) : {};
    } catch {
      return {};
    }
  }

  setMetadatos(data: any): void {
    this.metadatos = JSON.stringify(data);
  }

  // Método para normalizar el nombre
  static normalizarNombre(nombre: string): string {
    return nombre
      .trim()
      .replace(/\s+/g, ' ')
      .toUpperCase();
  }

  // Extraer tipo de dependencia del nombre
  static extraerTipo(nombre: string): string {
    const tipos = [
      'CÁMARA FEDERAL',
      'JUZGADO FEDERAL',
      'TRIBUNAL',
      'CORTE',
      'SECRETARÍA'
    ];

    for (const tipo of tipos) {
      if (nombre.toUpperCase().includes(tipo)) {
        return tipo;
      }
    }

    return 'OTRO';
  }
}