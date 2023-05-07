CREATE TABLE IF NOT EXISTS `feedback` (
`comment_id`     int(11)       NOT NULL AUTO_INCREMENT 	COMMENT 'PK: The comment id',
`name`           varchar(100)  NOT NULL                	COMMENT 'The commentators name',
`email`          varchar(100)  NOT NULL            	    COMMENT 'The commentators email',
`comment`        varchar(500)  NOT NULL            	    COMMENT 'The comment text',
PRIMARY KEY  (`comment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="User feedback about my website";