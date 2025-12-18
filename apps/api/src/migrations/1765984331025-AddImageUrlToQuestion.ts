import {
  type MigrationInterface,
  type QueryRunner,
  TableColumn,
} from 'typeorm';

export class AddImageUrlToQuestion1765984331025 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'questions',
      new TableColumn({
        name: 'image_url',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('questions', 'image_url');
  }
}
