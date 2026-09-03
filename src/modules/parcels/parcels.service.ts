import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Parcel, ParcelStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { CreateParcelInput } from './dto/create-parcel.input';
import { SearchParcelsInput } from './dto/search-parcels.input';
import { PaginationArgs } from '../../common/dto/pagination.args';
import { paginate, PaginatedResult } from '../../common/utils/pagination.util';

const parcelInclude = {
  sender: true,
  delivery: { include: { driver: true } },
} as const;

const ALLOWED_TRANSITIONS: Record<ParcelStatus, ParcelStatus[]> = {
  [ParcelStatus.PENDING]: [ParcelStatus.PICKED_UP, ParcelStatus.CANCELLED],
  [ParcelStatus.PICKED_UP]: [ParcelStatus.IN_TRANSIT],
  [ParcelStatus.IN_TRANSIT]: [ParcelStatus.DELIVERED],
  [ParcelStatus.DELIVERED]: [],
  [ParcelStatus.CANCELLED]: [],
};

@Injectable()
export class ParcelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly deliveriesService: DeliveriesService,
  ) {}

  create(data: CreateParcelInput, senderId: string): Promise<Parcel> {
    return this.prisma.parcel.create({
      data: {
        ...data,
        weight: data.weight ?? 0,
        senderId,
      },
      include: parcelInclude,
    });
  }

  findAll(
    pagination: PaginationArgs,
    input?: SearchParcelsInput,
  ): Promise<PaginatedResult<Parcel>> {
    const where = this.buildSearchWhere(input);

    return paginate(
      (args) =>
        this.prisma.parcel.findMany({
          where,
          include: parcelInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.parcel.count({ where }),
      pagination,
    );
  }

  private buildSearchWhere(input?: SearchParcelsInput): Prisma.ParcelWhereInput {
    if (!input) return {};

    const where: Prisma.ParcelWhereInput = {};

    if (input.status) {
      where.status = input.status;
    }

    if (input.from || input.to) {
      where.createdAt = {};
      if (input.from) {
        where.createdAt.gte = new Date(input.from);
      }
      if (input.to) {
        const to = new Date(input.to);
        to.setUTCHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    return where;
  }

  myParcels(
    senderId: string,
    pagination: PaginationArgs,
  ): Promise<PaginatedResult<Parcel>> {
    const where = { senderId };

    return paginate(
      (args) =>
        this.prisma.parcel.findMany({
          where,
          include: parcelInclude,
          orderBy: { createdAt: 'desc' },
          skip: args.skip,
          take: args.take,
        }),
      () => this.prisma.parcel.count({ where }),
      pagination,
    );
  }

  async findOne(id: string, currentUser: CurrentUser): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({
      where: { id },
      include: parcelInclude,
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    const canView =
      parcel.senderId === currentUser.id ||
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.PARTNER ||
      currentUser.role === UserRole.DRIVER;

    if (!canView) {
      throw new ForbiddenException('You cannot view this parcel');
    }

    return parcel;
  }

  async updateStatus(
    id: string,
    status: ParcelStatus,
    currentUser: CurrentUser,
  ): Promise<Parcel> {
    const parcel = await this.prisma.parcel.findUnique({ where: { id } });

    if (!parcel) {
      throw new NotFoundException(`Parcel ${id} not found`);
    }

    if (
      parcel.senderId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot update this parcel');
    }

    const allowed = ALLOWED_TRANSITIONS[parcel.status];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition parcel from ${parcel.status} to ${status}`,
      );
    }

    return this.prisma.parcel.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === ParcelStatus.DELIVERED ? new Date() : undefined,
      },
      include: parcelInclude,
    });
  }

  async assignDriver(parcelId: string, driverId: string) {
    await this.deliveriesService.assignToParcel(parcelId, driverId);
    return this.prisma.parcel.findUniqueOrThrow({
      where: { id: parcelId },
      include: parcelInclude,
    });
  }

  async assignAvailableDriver(parcelId: string) {
    await this.deliveriesService.assignAvailableDriverToParcel(parcelId);
    return this.prisma.parcel.findUniqueOrThrow({
      where: { id: parcelId },
      include: parcelInclude,
    });
  }

  remove(id: string, currentUser: CurrentUser): Promise<Parcel> {
    return this.prisma.parcel.findUnique({ where: { id } }).then((parcel) => {
      if (!parcel) {
        throw new NotFoundException(`Parcel ${id} not found`);
      }
      if (
        parcel.senderId !== currentUser.id &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('You cannot delete this parcel');
      }
      return this.prisma.parcel.delete({ where: { id } });
    });
  }
}
