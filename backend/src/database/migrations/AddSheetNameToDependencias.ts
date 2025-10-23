import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSheetNameToDependencias1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'dependencias',
      new TableColumn({
        name: 'sheetName',
        type: 'varchar',
        length: '200',
        isNullable: true,
        comment: 'Nombre de la hoja de Google Sheets correspondiente a esta dependencia',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('dependencias', 'sheetName');
  }
}
