import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Review, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateReviewInput } from './dto/create-review.input';

const reviewInclude = {
  order: true,
  author: true,
  restaurant: true,
  driver: true,
} as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateReviewInput, userId: string): Promise<Review> {
    if (!data.restaurantId && !data.driverId) {
      throw new BadRequestException(
        'You must review at least a restaurant or a driver',
      );
    }

    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order ${data.orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new ForbiddenException("You cannot review someone else's order");
    }

    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException(
        'You can only review an order that has been delivered',
      );
    }

    const existingReview = await this.prisma.review.findUnique({
      where: { orderId: order.id },
    });

    if (existingReview) {
      throw new BadRequestException('This order has already been reviewed');
    }

    if (data.restaurantId && data.restaurantId !== order.restaurantId) {
      throw new BadRequestException(
        'The restaurant must match the one from the order',
      );
    }

    const review = await this.prisma.review.create({
      data: {
        orderId: order.id,
        userId,
        restaurantId: data.restaurantId,
        driverId: data.driverId,
        rating: data.rating,
        comment: data.comment,
      },
      include: reviewInclude,
    });

    if (review.restaurantId) {
      await this.recomputeRestaurantRating(review.restaurantId);
    }

    return review;
  }

  findAll(): Promise<Review[]> {
    return this.prisma.review.findMany({
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByRestaurant(restaurantId: string): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { restaurantId },
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  findByDriver(driverId: string): Promise<Review[]> {
    return this.prisma.review.findMany({
      where: { driverId },
      include: reviewInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: reviewInclude,
    });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    return review;
  }

  async update(
    id: string,
    data: Partial<CreateReviewInput>,
    currentUser: CurrentUser,
  ): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    if (
      review.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot update this review');
    }

    const updated = await this.prisma.review.update({
      where: { id },
      data: {
        rating: data.rating,
        comment: data.comment,
      },
      include: reviewInclude,
    });

    if (updated.restaurantId) {
      await this.recomputeRestaurantRating(updated.restaurantId);
    }

    return updated;
  }

  async remove(id: string, currentUser: CurrentUser): Promise<Review> {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) {
      throw new NotFoundException(`Review ${id} not found`);
    }

    if (
      review.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('You cannot delete this review');
    }

    await this.prisma.review.delete({ where: { id } });

    if (review.restaurantId) {
      await this.recomputeRestaurantRating(review.restaurantId);
    }

    return review;
  }

  private async recomputeRestaurantRating(restaurantId: string) {
    const result = await this.prisma.review.aggregate({
      where: { restaurantId },
      _avg: { rating: true },
      _count: true,
    });

    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating: Math.round((result._avg.rating ?? 0) * 10) / 10,
      },
    });
  }
}
