import { IsIn } from 'class-validator';

/** DTO for the review decision — HR/Admin only. */
export class ReviewLeaveRequestDto {
  @IsIn(['approved', 'rejected'], {
    message: 'review status must be either approved or rejected',
  })
  status: 'approved' | 'rejected';
}
