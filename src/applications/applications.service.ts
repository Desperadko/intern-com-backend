import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../entities/application.entity';
import { User, UserRole } from '../entities/user.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepository: Repository<Application>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
    candidateId: number,
  ) {
    // Check if candidate exists and is actually a candidate
    const candidate = await this.userRepository.findOne({
      where: { id: candidateId, role: UserRole.CANDIDATE },
    });
    if (!candidate) {
      throw new BadRequestException('Invalid candidate');
    }

    // Check if opportunity exists
    const opportunity = await this.opportunityRepository.findOne({
      where: { id: createApplicationDto.opportunityId },
      relations: ['company'],
    });
    if (!opportunity) {
      throw new NotFoundException('Opportunity not found');
    }

    // Check if company has active subscription
    const hasActiveSubscription =
      await this.subscriptionsService.hasActiveSubscription(
        opportunity.company.id,
      );
    if (!hasActiveSubscription) {
      throw new BadRequestException(
        'This opportunity is not currently available',
      );
    }

    // Check if application already exists
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        candidateId,
        opportunityId: createApplicationDto.opportunityId,
      },
    });
    if (existingApplication) {
      throw new BadRequestException(
        'You have already applied for this opportunity',
      );
    }

    const application = this.applicationRepository.create({
      candidate,
      opportunity,
      candidateId,
      opportunityId: createApplicationDto.opportunityId,
      message: createApplicationDto.message,
    });

    return this.applicationRepository.save(application);
  }

  async findAll() {
    return this.applicationRepository.find({
      relations: ['candidate', 'opportunity', 'opportunity.company'],
      select: {
        candidate: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cvFileName: true,
        },
        opportunity: {
          id: true,
          title: true,
          company: {
            id: true,
            companyName: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['candidate', 'opportunity', 'opportunity.company'],
      select: {
        candidate: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cvFileName: true,
        },
        opportunity: {
          id: true,
          title: true,
          company: {
            id: true,
            companyName: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async findByCandidate(candidateId: number) {
    return this.applicationRepository.find({
      where: { candidateId },
      relations: ['opportunity', 'opportunity.company'],
      select: {
        opportunity: {
          id: true,
          title: true,
          company: {
            id: true,
            companyName: true,
          },
        },
      },
    });
  }

  async findByOpportunity(opportunityId: number) {
    return this.applicationRepository.find({
      where: { opportunityId },
      relations: ['candidate'],
      select: {
        candidate: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          cvFileName: true,
        },
      },
    });
  }

  async findByCompany(companyId: number) {
    // Check if company has active subscription
    const hasActiveSubscription =
      await this.subscriptionsService.hasActiveSubscription(companyId);
    if (!hasActiveSubscription) {
      throw new ForbiddenException(
        'Active subscription required to view applications',
      );
    }

    return this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.candidate', 'candidate')
      .leftJoinAndSelect('application.opportunity', 'opportunity')
      .where('opportunity.company = :companyId', { companyId })
      .select([
        'application',
        'candidate.id',
        'candidate.firstName',
        'candidate.lastName',
        'candidate.email',
        'candidate.cvFileName',
        'opportunity.id',
        'opportunity.title',
      ])
      .getMany();
  }

  async update(id: number, updateApplicationDto: UpdateApplicationDto) {
    const application = await this.findOne(id);

    Object.assign(application, updateApplicationDto);

    //application.candidate.email;

    return this.applicationRepository.save(application);
  }

  async remove(id: number) {
    const application = await this.findOne(id);
    await this.applicationRepository.remove(application);
  }

  async hasApplicationForCompany(
    candidateId: number,
    companyId: number,
  ): Promise<boolean> {
    const application = await this.applicationRepository
      .createQueryBuilder('application')
      .innerJoin('application.opportunity', 'opportunity')
      .where('application.candidateId = :candidateId', { candidateId })
      .andWhere('opportunity.companyId = :companyId', { companyId })
      .getOne();

    return !!application;
  }
}
