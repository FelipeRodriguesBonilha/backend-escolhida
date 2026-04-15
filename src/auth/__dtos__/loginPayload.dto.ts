import { User } from "src/generated/prisma/client";

export class LoginPayloadDto {
    id: string;
    role: string;

    constructor(user: User) {
        this.id = user.id;
        this.role = user.role;
    }
}