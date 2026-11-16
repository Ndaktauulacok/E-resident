-- CreateTable
CREATE TABLE `Role` (
    `id` VARCHAR(191) NOT NULL,
    `key` ENUM('ADMIN', 'KETUA_WARDEN', 'WARDEN', 'KETUA_ASRAMA', 'PEN_KETUA_ASRAMA', 'KETUA_BLOK', 'PEN_KETUA_BLOK', 'KETUA_DORM', 'PEN_KETUA_DORM', 'PENGHUNI') NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `rank` INTEGER NOT NULL,
    `description` VARCHAR(255) NULL,

    UNIQUE INDEX `Role_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(80) NOT NULL,
    `module` VARCHAR(60) NOT NULL,
    `description` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `Permission_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`roleId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserPermission` (
    `userId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT true,
    `grantedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`userId`, `permissionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(60) NOT NULL,
    `email` VARCHAR(160) NULL,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(20) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `passwordHash` VARCHAR(255) NULL,
    `status` ENUM('PENDING_ACTIVATION', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'PENDING_ACTIVATION',
    `roleId` VARCHAR(191) NOT NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_roleId_idx`(`roleId`),
    INDEX `User_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `userAgent` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Session_tokenHash_key`(`tokenHash`),
    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AccountToken` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('ACTIVATION', 'PASSWORD_RESET') NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AccountToken_tokenHash_key`(`tokenHash`),
    INDEX `AccountToken_userId_type_idx`(`userId`, `type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LoginAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(60) NOT NULL,
    `ip` VARCHAR(64) NULL,
    `success` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LoginAttempt_username_createdAt_idx`(`username`, `createdAt`),
    INDEX `LoginAttempt_ip_createdAt_idx`(`ip`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Block` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `gender` ENUM('LELAKI', 'PEREMPUAN') NOT NULL,
    `description` VARCHAR(255) NULL,
    `headUserId` VARCHAR(191) NULL,
    `assistantUserId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Block_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Dorm` (
    `id` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `floor` INTEGER NOT NULL DEFAULT 1,
    `capacity` INTEGER NOT NULL,
    `headUserId` VARCHAR(191) NULL,
    `assistantUserId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Dorm_blockId_idx`(`blockId`),
    UNIQUE INDEX `Dorm_blockId_code_key`(`blockId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WardenAssignment` (
    `wardenUserId` VARCHAR(191) NOT NULL,
    `blockId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`wardenUserId`, `blockId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Resident` (
    `id` VARCHAR(191) NOT NULL,
    `matricNo` VARCHAR(30) NOT NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `gender` ENUM('LELAKI', 'PEREMPUAN') NOT NULL,
    `phone` VARCHAR(20) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `dormId` VARCHAR(191) NOT NULL,
    `registeredAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('MENUNGGU_PENDAFTARAN', 'AKTIF', 'TIDAK_AKTIF', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU_PENDAFTARAN',
    `userId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Resident_matricNo_key`(`matricNo`),
    UNIQUE INDEX `Resident_userId_key`(`userId`),
    INDEX `Resident_dormId_status_idx`(`dormId`, `status`),
    INDEX `Resident_fullName_idx`(`fullName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResidentHistory` (
    `id` VARCHAR(191) NOT NULL,
    `residentId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(40) NOT NULL,
    `fromDormId` VARCHAR(191) NULL,
    `toDormId` VARCHAR(191) NULL,
    `changes` JSON NULL,
    `note` VARCHAR(255) NULL,
    `byUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ResidentHistory_residentId_createdAt_idx`(`residentId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ResidentRegistration` (
    `id` VARCHAR(191) NOT NULL,
    `residentId` VARCHAR(191) NOT NULL,
    `requestAccount` BOOLEAN NOT NULL DEFAULT true,
    `status` ENUM('MENUNGGU_KETUA_BLOK', 'MENUNGGU_WARDEN', 'PERLU_PEMBETULAN', 'DILULUSKAN', 'DITOLAK') NOT NULL DEFAULT 'MENUNGGU_KETUA_BLOK',
    `submittedById` VARCHAR(191) NOT NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ResidentRegistration_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceReport` (
    `id` VARCHAR(191) NOT NULL,
    `dormId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `session` ENUM('PAGI', 'MALAM') NOT NULL,
    `registeredCount` INTEGER NOT NULL,
    `presentCount` INTEGER NOT NULL,
    `absentCount` INTEGER NOT NULL,
    `status` ENUM('DRAF', 'MENUNGGU_KETUA_BLOK', 'PERLU_PEMBETULAN', 'DILULUSKAN_KETUA_BLOK', 'MENUNGGU_WARDEN', 'SELESAI') NOT NULL DEFAULT 'DRAF',
    `submittedById` VARCHAR(191) NOT NULL,
    `submittedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AttendanceReport_date_session_idx`(`date`, `session`),
    INDEX `AttendanceReport_status_idx`(`status`),
    UNIQUE INDEX `AttendanceReport_dormId_date_session_key`(`dormId`, `date`, `session`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceRecord` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `residentId` VARCHAR(191) NOT NULL,
    `present` BOOLEAN NOT NULL,
    `reason` VARCHAR(200) NULL,

    INDEX `AttendanceRecord_residentId_idx`(`residentId`),
    UNIQUE INDEX `AttendanceRecord_reportId_residentId_key`(`reportId`, `residentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AttendanceAmendment` (
    `id` VARCHAR(191) NOT NULL,
    `reportId` VARCHAR(191) NOT NULL,
    `byUserId` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `before` JSON NOT NULL,
    `after` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AttendanceAmendment_reportId_idx`(`reportId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Approval` (
    `id` VARCHAR(191) NOT NULL,
    `entityType` ENUM('ATTENDANCE_REPORT', 'RESIDENT_REGISTRATION', 'HYGIENE_INSPECTION', 'COMPLAINT', 'DISCIPLINE_RECORD') NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `stage` VARCHAR(40) NOT NULL,
    `action` ENUM('HANTAR', 'LULUS', 'KEMBALIKAN', 'TOLAK', 'PINDA') NOT NULL,
    `actorId` VARCHAR(191) NOT NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Approval_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `Approval_actorId_idx`(`actorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WardenSchedule` (
    `id` VARCHAR(191) NOT NULL,
    `wardenUserId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `startTime` VARCHAR(5) NOT NULL,
    `endTime` VARCHAR(5) NOT NULL,
    `location` VARCHAR(120) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WardenSchedule_date_idx`(`date`),
    INDEX `WardenSchedule_wardenUserId_date_idx`(`wardenUserId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMember` (
    `id` VARCHAR(191) NOT NULL,
    `hierarchy` ENUM('WARDEN', 'PELAJAR') NOT NULL,
    `userId` VARCHAR(191) NULL,
    `name` VARCHAR(120) NOT NULL,
    `position` VARCHAR(120) NOT NULL,
    `unit` VARCHAR(120) NULL,
    `phone` VARCHAR(20) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `parentId` VARCHAR(191) NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OrganizationMember_userId_key`(`userId`),
    INDEX `OrganizationMember_hierarchy_sortOrder_idx`(`hierarchy`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Announcement` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` TEXT NOT NULL,
    `attachmentUrl` VARCHAR(255) NULL,
    `target` ENUM('SEMUA', 'SEMUA_PENGHUNI', 'SEMUA_WARDEN', 'BLOK', 'DORM', 'ROLE') NOT NULL,
    `targetValue` VARCHAR(80) NULL,
    `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `authorId` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Announcement_publishedAt_idx`(`publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `body` VARCHAR(500) NULL,
    `link` VARCHAR(255) NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_readAt_idx`(`userId`, `readAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Complaint` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `location` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `photoUrl` VARCHAR(255) NULL,
    `status` ENUM('BAHARU', 'DALAM_SEMAKAN', 'DALAM_TINDAKAN', 'SELESAI', 'DITOLAK') NOT NULL DEFAULT 'BAHARU',
    `rejectReason` VARCHAR(255) NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Complaint_status_idx`(`status`),
    INDEX `Complaint_reporterId_idx`(`reporterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MaintenanceAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `complaintId` VARCHAR(191) NOT NULL,
    `assignee` VARCHAR(120) NOT NULL,
    `notes` VARCHAR(255) NULL,
    `assignedById` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HygieneInspection` (
    `id` VARCHAR(191) NOT NULL,
    `dormId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `kind` VARCHAR(20) NOT NULL,
    `scores` JSON NOT NULL,
    `totalScore` INTEGER NOT NULL,
    `notes` VARCHAR(500) NULL,
    `photoUrl` VARCHAR(255) NULL,
    `status` ENUM('MENUNGGU_KETUA_BLOK', 'MENUNGGU_WARDEN', 'PERLU_TINDAKAN', 'SELESAI') NOT NULL DEFAULT 'MENUNGGU_KETUA_BLOK',
    `correction` VARCHAR(255) NULL,
    `inspectorId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HygieneInspection_dormId_date_idx`(`dormId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DisciplineRecord` (
    `id` VARCHAR(191) NOT NULL,
    `residentId` VARCHAR(191) NOT NULL,
    `incidentAt` DATETIME(3) NOT NULL,
    `location` VARCHAR(120) NOT NULL,
    `category` VARCHAR(60) NOT NULL,
    `description` TEXT NOT NULL,
    `evidenceUrl` VARCHAR(255) NULL,
    `status` ENUM('DILAPORKAN', 'DALAM_SIASATAN', 'TINDAKAN_DIAMBIL', 'DITUTUP') NOT NULL DEFAULT 'DILAPORKAN',
    `actionNotes` TEXT NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `handlerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DisciplineRecord_residentId_idx`(`residentId`),
    INDEX `DisciplineRecord_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `action` VARCHAR(60) NOT NULL,
    `entityType` VARCHAR(60) NULL,
    `entityId` VARCHAR(40) NULL,
    `summary` VARCHAR(500) NOT NULL,
    `meta` JSON NULL,
    `ip` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemSetting` (
    `key` VARCHAR(80) NOT NULL,
    `value` JSON NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserPermission` ADD CONSTRAINT `UserPermission_grantedById_fkey` FOREIGN KEY (`grantedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AccountToken` ADD CONSTRAINT `AccountToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_headUserId_fkey` FOREIGN KEY (`headUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Block` ADD CONSTRAINT `Block_assistantUserId_fkey` FOREIGN KEY (`assistantUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dorm` ADD CONSTRAINT `Dorm_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `Block`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dorm` ADD CONSTRAINT `Dorm_headUserId_fkey` FOREIGN KEY (`headUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Dorm` ADD CONSTRAINT `Dorm_assistantUserId_fkey` FOREIGN KEY (`assistantUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WardenAssignment` ADD CONSTRAINT `WardenAssignment_wardenUserId_fkey` FOREIGN KEY (`wardenUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WardenAssignment` ADD CONSTRAINT `WardenAssignment_blockId_fkey` FOREIGN KEY (`blockId`) REFERENCES `Block`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resident` ADD CONSTRAINT `Resident_dormId_fkey` FOREIGN KEY (`dormId`) REFERENCES `Dorm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Resident` ADD CONSTRAINT `Resident_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResidentHistory` ADD CONSTRAINT `ResidentHistory_residentId_fkey` FOREIGN KEY (`residentId`) REFERENCES `Resident`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResidentHistory` ADD CONSTRAINT `ResidentHistory_byUserId_fkey` FOREIGN KEY (`byUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResidentRegistration` ADD CONSTRAINT `ResidentRegistration_residentId_fkey` FOREIGN KEY (`residentId`) REFERENCES `Resident`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ResidentRegistration` ADD CONSTRAINT `ResidentRegistration_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceReport` ADD CONSTRAINT `AttendanceReport_dormId_fkey` FOREIGN KEY (`dormId`) REFERENCES `Dorm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceReport` ADD CONSTRAINT `AttendanceReport_submittedById_fkey` FOREIGN KEY (`submittedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `AttendanceReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceRecord` ADD CONSTRAINT `AttendanceRecord_residentId_fkey` FOREIGN KEY (`residentId`) REFERENCES `Resident`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceAmendment` ADD CONSTRAINT `AttendanceAmendment_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `AttendanceReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AttendanceAmendment` ADD CONSTRAINT `AttendanceAmendment_byUserId_fkey` FOREIGN KEY (`byUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Approval` ADD CONSTRAINT `Approval_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WardenSchedule` ADD CONSTRAINT `WardenSchedule_wardenUserId_fkey` FOREIGN KEY (`wardenUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WardenSchedule` ADD CONSTRAINT `WardenSchedule_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMember` ADD CONSTRAINT `OrganizationMember_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `OrganizationMember`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Announcement` ADD CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Complaint` ADD CONSTRAINT `Complaint_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceAssignment` ADD CONSTRAINT `MaintenanceAssignment_complaintId_fkey` FOREIGN KEY (`complaintId`) REFERENCES `Complaint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MaintenanceAssignment` ADD CONSTRAINT `MaintenanceAssignment_assignedById_fkey` FOREIGN KEY (`assignedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HygieneInspection` ADD CONSTRAINT `HygieneInspection_dormId_fkey` FOREIGN KEY (`dormId`) REFERENCES `Dorm`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HygieneInspection` ADD CONSTRAINT `HygieneInspection_inspectorId_fkey` FOREIGN KEY (`inspectorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplineRecord` ADD CONSTRAINT `DisciplineRecord_residentId_fkey` FOREIGN KEY (`residentId`) REFERENCES `Resident`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplineRecord` ADD CONSTRAINT `DisciplineRecord_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplineRecord` ADD CONSTRAINT `DisciplineRecord_handlerId_fkey` FOREIGN KEY (`handlerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
