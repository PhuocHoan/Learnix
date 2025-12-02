import { IsEnum } from 'class-validator';

import { UserRole } from '../../users/enums/user-role.enum';

export class SelectRoleDto {
  @IsEnum(UserRole, { message: 'Role must be student or instructor' })
  role: UserRole;
}
