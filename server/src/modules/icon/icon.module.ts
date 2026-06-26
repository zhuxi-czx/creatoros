import { Module } from '@nestjs/common';
import { IconController } from './icon.controller';

@Module({ controllers: [IconController] })
export class IconModule {}
