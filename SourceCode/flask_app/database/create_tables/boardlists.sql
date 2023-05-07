CREATE TABLE IF NOT EXISTS `boardlists` (
`boardlist_id`    int(11)  	   NOT NULL auto_increment	  COMMENT 'PK: The id of this board list',
`board_id`        int(11)      NOT NULL 				  COMMENT 'FK: The board id',
`name`            varchar(100) NOT NULL                	  COMMENT 'The name of the list',
PRIMARY KEY (`boardlist_id`),
FOREIGN KEY (board_id) REFERENCES boards(board_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="Contains lists associated with each board";