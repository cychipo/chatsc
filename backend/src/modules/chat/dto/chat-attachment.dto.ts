export class GeneratePresignedUploadDto {
  conversationId!: string

  fileName!: string

  mimeType!: string

  sizeBytes!: number
}

export class MarkAttachmentUploadedDto {
  attachmentId!: string
}

export class ConfirmAttachmentDto {
  attachmentId!: string
}
