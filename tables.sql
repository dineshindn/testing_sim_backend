CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `firstName` varchar(15) NOT NULL
  `lastName` varchar(15) NOT NULL
  `role` tinyint(20) NOT NULL
  FOREIGN KEY `fk_oem` REFERENCES oem(id)
  `mobileNumber` varchar(15) NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
  `clientId` varchar(30) NOT NULL
  `email` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `oem` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(30) NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `networkProvider` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(30) NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simDetails` (
  `id` int(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `deviceId` int(15) NOT NULL
  `simNumber` int(15) NOT NULL
  `deviceSerialNumber` varchar(20) NOT NULL
  `imeiNumber` varchar(20) NOT NULL
  FOREIGN KEY `fk_networkProviderId` REFERENCES networkProvider(id)
  `fk_oemId` int(20) NOT NULL
  `vinMsnNumber` int(20) NOT NULL
  `registrationNumber` int(20) NOT NULL
  FOREIGN KEY `fk_subscriptionStatus` REFERENCES status(id)
  `subscriptionEndDate` DATE NOT NULL
  `mobileNumber` varchar(15) NOT NULL
  FOREIGN KEY `fk_status` REFERENCES status(id)
  `stateChangeDate` DATE NOT NULL
  `dispatchDate` DATE NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simTransactionHistory` (
  `id` int(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `requestNumber` int(20) NOT NULL
  FOREIGN KEY `fk_status` REFERENCES status(id)
  `raisedDate` DATE NOT NULL
  `requestedDate` DATE NOT NULL
  FOREIGN KEY `fk_assignedTo` REFERENCES users(id)
  `closedDate` DATE NOT NULL
  `resolution` varchar(50) NOT NULL
  `oldDeviceId` int(20) NOT NULL
  `newDeviceId` int(20) NOT NULL
  `dk_simNumber` int(20) NOT NULL
  `dk_newSimNumber` int(20) NOT NULL
  `oldDeviceSerialNumber` varchar(25) NOT NULL
  `newDeviceSerialNumber` varchar(25) NOT NULL
  `oldImeiNumber` varchar(20) NOT NULL
  `newImeiNumber` varchar(20) NOT NULL
  FOREIGN KEY `fk_oldNetworkProviderId` REFERENCES networkProvider(id)
  FOREIGN KEY `fk_newNetworkProviderId` REFERENCES networkProvider(id)
  FOREIGN KEY `fk_oldOemId` REFERENCES oem(id)
  FOREIGN KEY `fk_newOemId` REFERENCES oem(id)
  `oldVinMsnNumber` int(20) NOT NULL
  `newVinMsnNumber` int(20) NOT NULL
  `oldRegistrationNumber` int(20) NOT NULL
  `newRegistrationNumber` int(20) NOT NULL
  `subscriptionStatus` varchar(50) NOT NULL
  `subscriptionEndDate` DATE NOT NULL
  `oldMobileNumber` int(20) NOT NULL
  `newMobileNumber` int(20) NOT NULL
  FOREIGN KEY `fk_status` REFERENCES status(id)
  `stateChangeDate` DATE NOT NULL
  `dispatchDate` DATE NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `userRequests` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  FOREIGN KEY `fk_simId` REFERENCES simDetails(id)
  `requestedState` varchar(50) NOT NULL
  `comments` varchar(100) NOT NULL
  FOREIGN KEY `fk_assignedTo` REFERENCES users(id)
  FOREIGN KEY `fk_createdBy` REFERENCES users(id)
  `status` varchar(50) NOT NULL
  `resolution` varchar(50) NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
  `closedDate` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `simSwap` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  FOREIGN KEY `fk_createdBy` REFERENCES users(id)
  FOREIGN KEY `fk_currentSim` REFERENCES simDetails(id)
  FOREIGN KEY `fk_newSim` REFERENCES simDetails(id)
  `reasonForSimReplacement` varchar(50) NOT NULL
  FOREIGN KEY `fk_status` REFERENCES status(id)
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

CREATE TABLE IF NOT EXISTS `status` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(20) NOT NULL
  `description` varchar(20) NOT NULL
  `insertUTC` DATE NOT NULL
  `updateUTC` DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
