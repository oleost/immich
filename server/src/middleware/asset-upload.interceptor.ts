import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { of } from 'rxjs';
import { AssetMediaResponseDto } from 'src/dtos/asset-media-response.dto';
import { AssetUploadSource } from 'src/dtos/asset-media.dto';
import { ImmichHeader } from 'src/enum';
import { AuthenticatedRequest } from 'src/middleware/auth.guard';
import { AssetMediaService } from 'src/services/asset-media.service';
import { fromMaybeArray } from 'src/utils/request';

@Injectable()
export class AssetUploadInterceptor implements NestInterceptor {
  constructor(private service: AssetMediaService) {}

  async intercept(context: ExecutionContext, next: CallHandler<any>) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response<AssetMediaResponseDto>>();

    const checksum = fromMaybeArray(req.headers[ImmichHeader.Checksum]);
    const uploadSource = fromMaybeArray(req.headers[ImmichHeader.UploadSource]) as AssetUploadSource | undefined;
    const response = await this.service.getUploadAssetIdByChecksum(req.user, checksum, uploadSource);
    if (response) {
      res.status(200);
      return of(response);
    }

    return next.handle();
  }
}
