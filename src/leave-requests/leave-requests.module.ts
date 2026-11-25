import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { LeaveRequest } from './entities/leave-request.entity';
import { Employee } from '../employees/entities/employee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LeaveRequest, Employee])],
  controllers: [LeaveRequestsController],
  providers: [LeaveRequestsService],
  exports: [LeaveRequestsService],
})
export class LeaveRequestsModule {}
