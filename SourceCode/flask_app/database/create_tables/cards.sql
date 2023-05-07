CREATE TABLE IF NOT EXISTS `cards` (
`card_id`         int(11)  	   NOT NULL auto_increment	  COMMENT 'PK: The id of this card',
`boardlist_id`    int(11)      NOT NULL 				  COMMENT 'FK: The board list id',
`name`            varchar(100) NOT NULL                	  COMMENT 'The name of the card',
`details`         varchar(5000) NOT NULL                   COMMENT 'The details about this card',
PRIMARY KEY (`card_id`),
FOREIGN KEY (boardlist_id) REFERENCES boardlists(boardlist_id)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT="Contains all cards within all lists";