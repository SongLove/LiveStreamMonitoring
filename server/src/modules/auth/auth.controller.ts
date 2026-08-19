import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { ApiResponseDto } from '../../common/swagger/api-response.dto';

export class ClientLoginDto {
  @ApiProperty({ example: '081xxx', description: 'wx.login() 返回的临时 code' })
  @IsString()
  code!: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'admin123456', minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class ClientLoginResponseDto {
  @ApiProperty({ description: 'JWT，后续请求 Header: Authorization Bearer <token>' })
  accessToken!: string;

  @ApiProperty()
  userId!: string;
}

export class AdminLoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  adminId!: string;

  @ApiProperty({ type: [String], example: ['super_admin'] })
  roles!: string[];
}

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('api/v1/auth/login')
  @ApiTags('小程序-认证')
  @ApiOperation({ summary: '小程序微信登录', description: '用 code 换 openid 并签发 Client JWT；不返回 session_key' })
  @ApiBody({ type: ClientLoginDto })
  @ApiResponse({ status: 201, description: '登录成功', type: ApiResponseDto<ClientLoginResponseDto> })
  async clientLogin(@Body() body: ClientLoginDto) {
    return this.authService.clientLogin(body.code);
  }

  @Post('api/admin/auth/login')
  @ApiTags('管理后台')
  @ApiOperation({ summary: '管理后台登录', description: '独立于小程序 JWT 的后台认证' })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({ status: 201, type: ApiResponseDto<AdminLoginResponseDto> })
  @ApiResponse({ status: 401, description: '账号或密码错误' })
  async adminLogin(@Body() body: AdminLoginDto) {
    try {
      return await this.authService.adminLogin(body.username, body.password);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
