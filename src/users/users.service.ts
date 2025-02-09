import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CvUploadDto } from './dto/cv-upload.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(role?: UserRole) {
    if (role) {
      return this.userRepository.find({
        where: { role },
        select: [
          'id',
          'firstName',
          'lastName',
          'email',
          'companyName',
          'role',
          'createdAt',
          'phoneNumber',
        ],
      });
    }
    return this.userRepository.find({
      select: [
        'id',
        'firstName',
        'lastName',
        'email',
        'companyName',
        'role',
        'createdAt',
        'phoneNumber',
      ],
    });
  }

  async getAllPartnersCoordinates() {
    return this.userRepository.find({
      where: { role: UserRole.PARTNER, subscriptionStatus: 'active' },
      select: [
        'id',
        'companyName',
        'companyCoordinates',
        'email',
        'phoneNumber',
      ],
    });
  }

  async uploadCv(userId: number, cvUploadDto: CvUploadDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB
    const fileBuffer = Buffer.from(cvUploadDto.fileBase64, 'base64');

    if (fileBuffer.length > maxFileSizeBytes) {
      throw new BadRequestException('CV file size exceeds 10MB limit');
    }

    user.cv = fileBuffer;
    user.cvFileName = cvUploadDto.fileName;
    user.cvMimeType = cvUploadDto.mimeType;
    user.cvUploadedAt = new Date();

    return this.userRepository.save(user);
  }

  async downloadCv(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'cv', 'cvFileName', 'cvMimeType'],
    });

    if (!user || !user.cv) {
      throw new NotFoundException('CV not found');
    }

    return {
      cvFileName: user.cvFileName,
      cvMimeType: user.cvMimeType,
      cv: user.cv.toString('base64'),
    };
  }

  async removeCv(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.cv) {
      throw new NotFoundException('User does not have a CV');
    }

    user.cv = null;
    user.cvFileName = null;
    user.cvMimeType = null;
    user.cvUploadedAt = null;

    const savedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = savedUser;
    return result;
  }

  async updateRole(id: number, role: UserRole) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.role = role;
    return this.userRepository.save(user);
  }

  async remove(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['opportunities', 'applications'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (user.role === UserRole.PARTNER) {
        if (user.opportunities) {
          const opportunityIds = user.opportunities.map((opp) => opp.id);
          if (opportunityIds.length > 0) {
            await queryRunner.manager.delete('applications', {
              opportunity: { id: In(opportunityIds) },
            });
          }
        }

        await queryRunner.manager.delete('opportunities', {
          company: { id: user.id },
        });
      }

      if (user.role === UserRole.CANDIDATE) {
        await queryRunner.manager.delete('applications', {
          candidate: { id: user.id },
        });
      }

      await queryRunner.manager.remove(user);

      await queryRunner.commitTransaction();

      return user;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);

    const savedUser = await this.userRepository.save(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, cv, ...result } = savedUser;
    return result;
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, cv, ...result } = user;
    return {
      ...result,
      subscriptionStatus: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionId: user.subscriptionId,
      subscriptionEndDate: user.subscriptionEndDate,
    };
  }
}
