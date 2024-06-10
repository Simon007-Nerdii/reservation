import { NestFactory } from '@nestjs/core';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module';
import { Client } from '../entities/client.entity';
import { Provider } from '../entities/provider.entity';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const providerRepository = app.get<Repository<Provider>>(getRepositoryToken(Provider));
  const clientRepository = app.get<Repository<Client>>(getRepositoryToken(Client));

  const providers = [
    { name: 'Dr. Jekyll' },
    { name: 'Dr. Hyde' },
  ];

  const clients = [
    { name: 'John Doe', email: 'john@example.com' },
    { name: 'Jane Doe', email: 'jane@example.com' },
  ];

  await providerRepository.save(providers);
  await clientRepository.save(clients);

  await app.close();
}

bootstrap().catch(err => console.error('Error seeding database', err));
