CREATE TABLE IF NOT EXISTS `boardemails` (
`boardemail_id`   int(11)  	   NOT NULL auto_increment	  COMMENT 'PK: The id of this board email',
`board_id`        int(11)      NOT NULL 				  COMMENT 'FK: The board id',
`email`           varchar(100) NOT NULL                   COMMENT 'the email',
PRIMARY KEY (`boardemail_id`),
FOREIGN KEY (board_id) REFERENCES boards(board_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="Contains emails associated with each board";