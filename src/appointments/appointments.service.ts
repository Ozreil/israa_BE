import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AppointmentStatus, UserRole } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { AuthUser } from '../auth/current-user.decorator';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly db: DatabaseService) {}

  async createAppointment(dto: CreateAppointmentDto, authUser: AuthUser) {
    const actor = await this.db.user.findUnique({ where: { id: authUser.userId } });

    if (!actor) {
      throw new UnauthorizedActorException();
    }

    if (actor.role === UserRole.PATIENT) {
      throw new ForbiddenException('Patients cannot create appointments');
    }

    const [patient, admin] = await Promise.all([
      this.db.user.findUnique({ where: { id: dto.patientId } }),
      this.db.user.findUnique({ where: { id: dto.adminId } }),
    ]);

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (patient.role !== UserRole.PATIENT) {
      throw new BadRequestException('patientId must belong to a PATIENT user');
    }

    if (
      admin.role !== UserRole.ADMIN &&
      admin.role !== UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException(
        'adminId must belong to an ADMIN or SUPER_ADMIN user',
      );
    }

    return this.db.appointment.create({
      data: {
        patientId: dto.patientId,
        adminId: dto.adminId,
        appointmentDate: new Date(dto.appointmentDate),
        status: dto.status ?? AppointmentStatus.AVAILABLE,
        notes: dto.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getAppointments(query: GetAppointmentsDto, authUser: AuthUser) {
    const actor = await this.db.user.findUnique({ where: { id: authUser.userId } });

    if (!actor) {
      throw new UnauthorizedActorException();
    }

    const where = {
      patientId:
        actor.role === UserRole.PATIENT ? actor.id : (query.patientId ?? undefined),
      adminId: query.adminId,
      status: query.status,
    };

    return this.db.appointment.findMany({
      where,
      orderBy: {
        appointmentDate: 'asc',
      },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}

class UnauthorizedActorException extends ForbiddenException {
  constructor() {
    super('Authenticated user is not found');
  }
}
