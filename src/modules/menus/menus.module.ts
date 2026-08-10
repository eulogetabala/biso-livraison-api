import { Module } from '@nestjs/common';
import { MenusService } from './menus.service';
import { MenusResolver } from './menus.resolver';
import { AuthModule } from '../auth/auth.module';
import { RestaurantsModule } from '../restaurants/restaurants.module';

@Module({
  imports: [AuthModule, RestaurantsModule],
  providers: [MenusService, MenusResolver],
  exports: [MenusService],
})
export class MenusModule {}
