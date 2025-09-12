-- CreateTable
CREATE TABLE `User` (
    `User_Id` INTEGER NOT NULL AUTO_INCREMENT,
    `User_Name` VARCHAR(191) NOT NULL,
    `E_mail` VARCHAR(191) NOT NULL,
    `Password` VARCHAR(191) NOT NULL,
    `Role` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `User_E_mail_key`(`E_mail`),
    PRIMARY KEY (`User_Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Department` (
    `Dept_Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Dept_Name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`Dept_Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Grade` (
    `Grade_Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Grade_Name` VARCHAR(191) NOT NULL,
    `Basic_Salary` DOUBLE NOT NULL,
    `Grade_Bonus` DOUBLE NOT NULL,

    PRIMARY KEY (`Grade_Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee` (
    `Employee_Id` INTEGER NOT NULL AUTO_INCREMENT,
    `User_Id` INTEGER NOT NULL,
    `Dept_Id` INTEGER NOT NULL,
    `Grade_Id` INTEGER NOT NULL,
    `Hire_Date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`Employee_Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Salary` (
    `Salary_Id` INTEGER NOT NULL AUTO_INCREMENT,
    `Employee_Id` INTEGER NOT NULL,
    `Salary` DOUBLE NOT NULL,
    `Salary_Date` DATETIME(3) NOT NULL,

    PRIMARY KEY (`Salary_Id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_User_Id_fkey` FOREIGN KEY (`User_Id`) REFERENCES `User`(`User_Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_Dept_Id_fkey` FOREIGN KEY (`Dept_Id`) REFERENCES `Department`(`Dept_Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee` ADD CONSTRAINT `Employee_Grade_Id_fkey` FOREIGN KEY (`Grade_Id`) REFERENCES `Grade`(`Grade_Id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Salary` ADD CONSTRAINT `Salary_Employee_Id_fkey` FOREIGN KEY (`Employee_Id`) REFERENCES `Employee`(`Employee_Id`) ON DELETE RESTRICT ON UPDATE CASCADE;
