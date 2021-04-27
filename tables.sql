CREATE TABLE IF NOT EXISTS `status` (
  `id` bigint(20) NOT NULL PRIMARY KEY,
  `name` varchar(20) NOT NULL,
  `description` varchar(20) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `requestStatus` (
  `id` bigint(20) NOT NULL PRIMARY KEY,
  `name` varchar(20) NOT NULL,
  `description` varchar(20) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `oem` (
  `id` bigint(20) NOT NULL PRIMARY KEY,
  `name` varchar(30) NOT NULL,
  `description` varchar(20) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `networkProvider` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(30) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `firstName` varchar(15) NOT NULL,
  `lastName` varchar(15) NOT NULL,
  `role` tinyint(20) NOT NULL,
  `fk_oem` bigint(20) NULL,
  FOREIGN KEY (`fk_oem`) REFERENCES oem(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `mobileNumber` varchar(15) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simDetails` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `deviceId` varchar(15) NULL,
  `simNumber` int(15) NOT NULL,
  `deviceSerialNumber` varchar(20) NOT NULL,
  `imeiNumber` varchar(20) NOT NULL,
  `fk_networkProviderId` bigint(20) NULL,
  FOREIGN KEY (`fk_networkProviderId`) REFERENCES `networkProvider` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_oem` bigint(20) NULL,
  FOREIGN KEY (`fk_oem`) REFERENCES oem(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `vinMsnNumber` varchar(25) NULL, 
  `registrationNumber` int(20) NOT NULL,
  `subscriptionStatus` varchar(50) NOT NULL,
  `subscriptionEndDate` DATE,
  `mobileNumber` varchar(15) NOT NULL,
  `fk_status` bigint(20) NULL,
  FOREIGN KEY (`fk_status`) REFERENCES `status` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `stateChangeDate` DATE,
  `dispatchDate` DATE,
  `isRequested` boolean DEFAULT 0,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simTransactionHistory` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestNumber` int(20) NOT NULL,
  `fk_status` bigint(20) NULL,
  FOREIGN KEY (`fk_status`) REFERENCES `status` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `raisedDate` DATE NOT NULL,
  `requestedDate` DATE NOT NULL,
  `fk_assignedTo` bigint(20) NULL,
  FOREIGN KEY (`fk_assignedTo`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `closedDate` DATE NOT NULL,
  `resolution` varchar(50) NOT NULL,
  `oldDeviceId` int(20) NOT NULL,
  `newDeviceId` int(20) NOT NULL,
  `dk_simNumber` int(20) NOT NULL,
  `dk_newSimNumber` int(20) NOT NULL,
  `oldDeviceSerialNumber` varchar(25) NOT NULL,
  `newDeviceSerialNumber` varchar(25) NOT NULL,
  `oldImeiNumber` varchar(20) NOT NULL,
  `newImeiNumber` varchar(20) NOT NULL,
  `fk_oldNetworkProviderId` bigint(20) NULL,
  FOREIGN KEY (`fk_oldNetworkProviderId`) REFERENCES `networkProvider` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_newNetworkProviderId` bigint(20) NULL,
  FOREIGN KEY (`fk_newNetworkProviderId`) REFERENCES `networkProvider` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_oldOemId` bigint(20) NULL,
  FOREIGN KEY (`fk_oldOemId`) REFERENCES `oem` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_newOemId` bigint(20) NULL,
  FOREIGN KEY (`fk_newOemId`) REFERENCES `oem` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `oldVinMsnNumber` int(20) NOT NULL,
  `newVinMsnNumber` int(20) NOT NULL,
  `oldRegistrationNumber` int(20) NOT NULL,
  `newRegistrationNumber` int(20) NOT NULL,
  `subscriptionStatus` varchar(50) NOT NULL,
  `subscriptionEndDate` DATE,
  `oldMobileNumber` int(20) NOT NULL,
  `newMobileNumber` int(20) NOT NULL,
  `stateChangeDate` DATE,
  `dispatchDate` DATE,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `userRequests` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestNumber` varchar(15) NOT NULL,
  `fk_simId` bigint(20) NULL,
  FOREIGN KEY (`fk_simId`) REFERENCES `simDetails` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_requestedState` bigint(20) NULL,
  FOREIGN KEY (`fk_requestedState`) REFERENCES `requestStatus` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `status` varchar(50),
  `comments` varchar(100),
  `fk_assignedTo` bigint(20) NULL,
  FOREIGN KEY (`fk_assignedTo`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_createdBy` bigint(20) NULL,
  FOREIGN KEY (`fk_createdBy`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `resolution` varchar(50) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `closedDate` DATE,
  `raisedDate` DATE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simSwap` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `fk_createdBy` bigint(20) NULL,
  FOREIGN KEY (`fk_createdBy`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_oldSim` bigint(20) NULL,
  FOREIGN KEY (`fk_oldSim`) REFERENCES `simDetails` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_newSim` bigint(20) NULL,
  FOREIGN KEY (`fk_newSim`) REFERENCES `simDetails` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `reasonForSimReplacement` varchar(50) NOT NULL,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `isRead` boolean DEFAULT 0,
  `fk_createdBy` bigint(20) NULL,
  FOREIGN KEY (`fk_createdBy`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_userRequestsId` bigint(20) NULL,
  FOREIGN KEY (`fk_userRequestsId`) REFERENCES `userRequests` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `fk_resolvedBy` bigint(20) NULL,
  FOREIGN KEY (`fk_resolvedBy`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  `insertUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updateUTC` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

