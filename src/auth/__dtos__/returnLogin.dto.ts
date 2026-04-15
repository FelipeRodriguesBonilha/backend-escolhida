import { ReturnUserDto } from "src/users/__dtos__/returnUser.dto";

export interface ReturnLoginDto {
    user: ReturnUserDto;
    accessToken: string;
}