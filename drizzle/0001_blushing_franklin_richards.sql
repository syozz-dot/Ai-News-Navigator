CREATE TABLE `insights` (
	`id` int AUTO_INCREMENT NOT NULL,
	`headline` text NOT NULL,
	`subheadline` text,
	`content` text NOT NULL,
	`source` text,
	`urgency` varchar(128),
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `insights_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `news_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`newsId` varchar(64) NOT NULL,
	`headline` text NOT NULL,
	`headlineCn` text,
	`tag` varchar(64),
	`source` varchar(128),
	`url` text,
	`time` varchar(32),
	`urgency` enum('critical','high','medium') NOT NULL DEFAULT 'medium',
	`summary` text,
	`powerShift` text,
	`businessInsight` text,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `news_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `news_items_newsId_unique` UNIQUE(`newsId`)
);
--> statement-breakpoint
CREATE TABLE `papers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`paperId` varchar(64) NOT NULL,
	`title` text NOT NULL,
	`titleCn` text,
	`tag` varchar(64),
	`source` varchar(128),
	`url` text,
	`submitted` varchar(32),
	`impactScore` float,
	`corePrinciple` text,
	`bottomLogic` text,
	`productImagination` text,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `papers_id` PRIMARY KEY(`id`),
	CONSTRAINT `papers_paperId_unique` UNIQUE(`paperId`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(64) NOT NULL,
	`name` varchar(256) NOT NULL,
	`tagline` text,
	`tag` varchar(64),
	`source` varchar(128),
	`url` text,
	`upvotes` int,
	`verdict` enum('real-need','pseudo-need','watch') NOT NULL DEFAULT 'watch',
	`painPointAnalysis` text,
	`interactionInnovation` text,
	`publishedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productId_unique` UNIQUE(`productId`)
);
