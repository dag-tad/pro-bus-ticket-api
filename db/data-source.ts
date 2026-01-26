import { DataSource, DataSourceOptions } from 'typeorm';

// const isCompiled = __dirname.includes('dist');

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  database: 'swosh_db',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: 'postgres',
  password: 'root',
  synchronize: true,
  entities: ['dist/**/*.entity.js'],
  // entities: ['dist/**/*.entity.js'],
  // migrations: ['dist/db/migrations/*.js']
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
