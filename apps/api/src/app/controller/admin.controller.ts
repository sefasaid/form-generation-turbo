import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../guard/admin.guard';
import { AdminService } from '../service/admin.service';
import { Form, FormSession } from '@repo/prisma';
import { FormResponseDto } from '../dto/form-response.dto';
import { FormCreateDto } from '../dto/form-create.dto';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('forms')
    async getForms(): Promise<{ forms: Form[] }> {
        return this.adminService.getForms();
    }

    @Post('forms')
    async createForm(@Body() formData: FormCreateDto): Promise<FormResponseDto> {
        return this.adminService.createOrUpdateFormFromJson(formData);
    }

    @Put('forms/:key')
    async updateForm(
        @Param('key') key: string,
        @Body() formData: FormCreateDto,
    ): Promise<FormResponseDto> {
        return this.adminService.createOrUpdateFormFromJson({ ...formData, key });
    }

    @Get('forms/:key')
    async getForm(@Param('key') key: string): Promise<FormResponseDto> {
        return this.adminService.getForm(key);
    }

    @Get('sessions')
    async getSessions(): Promise<{ sessions: FormSession[] }> {
        return this.adminService.getSessions();
    }

    @Get('sessions/:id')
    async getSession(@Param('id') id: string): Promise<FormSession> {
        return this.adminService.getSession(id);
    }
}
