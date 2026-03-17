import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreatePatientDto } from './dto/create-patient.dto';

@Injectable()
export class PatientsService {
  constructor(private readonly db: DatabaseService) {}

  async createPatient(dto: CreatePatientDto) {
    try {
      const patient = await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            fullName: dto.fullName.trim(),
            role: UserRole.PATIENT,
            email: null,
            passwordHash: null,
          },
        });

        return tx.patientProfile.create({
          data: {
            userId: user.id,
            phone: dto.phone.trim(),
            age: dto.age,
            gender: dto.gender.trim(),
            height: dto.height,
            currentWeight: dto.currentWeight,
            targetWeight: dto.targetWeight,
            activityLevel: dto.activityLevel.trim(),
            goal: dto.goal.trim(),
            notes: dto.notes?.trim() || null,
          },
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });
      });

      return patient;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A patient with this phone already exists');
      }

      throw error;
    }
  }

  async getPatientById(userId: string) {
    const patient = await this.db.patientProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with user id ${userId} was not found`);
    }

    return patient;
  }
}
