
export class UserLoginResponseDto {
    token!: string;
    user!: {
        id: string;
        username: string;
        createdAt: Date;
        updatedAt: Date;
    }
}
