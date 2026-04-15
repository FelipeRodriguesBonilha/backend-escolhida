import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { LoginPayloadDto } from 'src/auth/__dtos__/loginPayload.dto';
import { Role } from 'src/users/__enums__/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private readonly jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }

        const { authorization } = context.switchToHttp().getRequest().headers;

        const loginPayload: LoginPayloadDto | undefined = await this.jwtService.verifyAsync(authorization, { secret: process.env.JWT_SECRET }).catch(() => undefined);

        if (!loginPayload) {
            return false;
        }

        return requiredRoles.some((role) => role === loginPayload.role);
    }
}