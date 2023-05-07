import mysql.connector
import glob
import json
import csv
from io import StringIO
import itertools
import hashlib
import os
import cryptography
from cryptography.fernet import Fernet
from math import pow

class database:

    def __init__(self, purge = False):

        # Grab information from the configuration file
        self.database       = 'db'
        self.host           = '127.0.0.1'
        self.user           = 'master'
        self.port           = 3306
        self.password       = 'master'
        self.tables         = ['institutions', 'positions', 'experiences', 'skills','feedback', 'users', 'boards',
                               'boardemails', 'boardlists', 'cards']
        
        # NEW IN HW 3-----------------------------------------------------------------
        self.encryption     =  {   'oneway': {'salt' : b'averysaltysailortookalongwalkoffashortbridge',
                                                 'n' : int(pow(2,5)),
                                                 'r' : 9,
                                                 'p' : 1
                                             },
                                'reversible': { 'key' : '7pK_fnSKIjZKuv_Gwc--sZEMKn2zc8VvD6zS96XcNHE='}
                                }
        #-----------------------------------------------------------------------------

    def query(self, query = "SELECT * FROM users", parameters = None):

        cnx = mysql.connector.connect(host     = self.host,
                                      user     = self.user,
                                      password = self.password,
                                      port     = self.port,
                                      database = self.database,
                                      charset  = 'latin1'
                                     )


        if parameters is not None:
            cur = cnx.cursor(dictionary=True)
            cur.execute(query, parameters)
        else:
            cur = cnx.cursor(dictionary=True)
            cur.execute(query)

        # Fetch one result
        row = cur.fetchall()
        cnx.commit()

        if "INSERT" in query:
            cur.execute("SELECT LAST_INSERT_ID()")
            row = cur.fetchall()
            cnx.commit()
        cur.close()
        cnx.close()
        return row

    def about(self, nested=False):
        query = """select concat(col.table_schema, '.', col.table_name) as 'table',
                          col.column_name                               as column_name,
                          col.column_key                                as is_key,
                          col.column_comment                            as column_comment,
                          kcu.referenced_column_name                    as fk_column_name,
                          kcu.referenced_table_name                     as fk_table_name
                    from information_schema.columns col
                    join information_schema.tables tab on col.table_schema = tab.table_schema and col.table_name = tab.table_name
                    left join information_schema.key_column_usage kcu on col.table_schema = kcu.table_schema
                                                                     and col.table_name = kcu.table_name
                                                                     and col.column_name = kcu.column_name
                                                                     and kcu.referenced_table_schema is not null
                    where col.table_schema not in('information_schema','sys', 'mysql', 'performance_schema')
                                              and tab.table_type = 'BASE TABLE'
                    order by col.table_schema, col.table_name, col.ordinal_position;"""
        results = self.query(query)
        if nested == False:
            return results

        table_info = {}
        for row in results:
            table_info[row['table']] = {} if table_info.get(row['table']) is None else table_info[row['table']]
            table_info[row['table']][row['column_name']] = {} if table_info.get(row['table']).get(row['column_name']) is None else table_info[row['table']][row['column_name']]
            table_info[row['table']][row['column_name']]['column_comment']     = row['column_comment']
            table_info[row['table']][row['column_name']]['fk_column_name']     = row['fk_column_name']
            table_info[row['table']][row['column_name']]['fk_table_name']      = row['fk_table_name']
            table_info[row['table']][row['column_name']]['is_key']             = row['is_key']
            table_info[row['table']][row['column_name']]['table']              = row['table']
        return table_info



    def createTables(self, purge=False, data_path = 'flask_app/database/'):
        TABLE_NAMES = ['institutions', 'positions', 'experiences', 'skills', 'feedback', 'users', 'boards',
                       'boardemails', 'boardlists', 'cards']  # creation order matters!

        # Replaces all tables if purge is true
        if purge:
            TABLE_NAMES_REVERSED = list(reversed(TABLE_NAMES))  # can't drop if dependencies via foreign keys
            for table_name in TABLE_NAMES_REVERSED:
                query = f"DROP TABLE IF EXISTS {table_name};"
                self.query(query)

        for table_name in TABLE_NAMES:
            # Create tables
            with open(data_path + 'create_tables/' + table_name + '.sql', 'r') as sql_file:
                query = sql_file.read()
                self.query(query)

            # Populate tables with initial data, unless that table does not have any.
            if table_name not in {'institutions', 'positions', 'experiences', 'skills'}:
                continue

            with open(data_path + 'initial_data/' + table_name + '.csv', 'r') as csv_file:
                reader = csv.reader(csv_file, delimiter=',')

                first_line = True
                parameters = []

                for row in reader:

                    # first line is columns
                    if first_line:
                        columns = row
                        first_line = False

                    # remaining lines are parameters
                    else:
                        parameters.append(row)

                self.insertRows(table_name, columns, parameters)

    def insertRows(self, table='table', columns=['x','y'], parameters=[['v11','v12'],['v21','v22']]):
        # The list comprehension below returns ['('v11', 'v12')', '('v21', 'v22')'],
        # joining it returns "('v11', 'v12'), ('v21', 'v22')" as desired
        query = "INSERT INTO {} ({}) VALUES {};" \
            .format(table, ', '.join(columns), ', '.join(['(\'' + '\', \''.join(i) + '\')' for i in parameters]))
        query = query.replace("'NULL'", "NULL")  # fix NULL being treated as a string
        self.query(query)

    def deleteRows(self, table, ids):
        table_to_id = {'experiences': 'experience_id', 'institutions': 'inst_id', 'positions': 'position_id',
                       'skills': 'skill_id'}  # map table name to what the id attribute is called
        for id_ in ids:
            # We need to delete in the correct order such that dependencies don't break things
            if table == 'skills':
                query = "DELETE FROM {} WHERE {} = {};".format(table, table_to_id[table], id_)
                self.query(query)
            elif table == 'experiences':
                query = "SELECT * FROM skills WHERE experience_id = {};".format(id_)
                result = self.query(query)
                for r in result:
                    query = "DELETE FROM {} WHERE {} = {};".format('skills', 'skill_id', r['skill_id'])
                    self.query(query)
                query = "DELETE FROM {} WHERE {} = {};".format(table, table_to_id[table], id_)
                self.query(query)
            elif table == 'positions':
                query = "SELECT * FROM experiences WHERE position_id = {};".format(id_)
                result = self.query(query)
                for r in result:
                    query = "SELECT * FROM skills WHERE experience_id = {};".format(r['experience_id'])
                    result_ = self.query(query)
                    for r_ in result_:
                        query = "DELETE FROM {} WHERE {} = {};".format('skills', 'skill_id', r_['skill_id'])
                        self.query(query)
                    query = "DELETE FROM {} WHERE {} = {};".format('experiences', 'experience_id', r['experience_id'])
                    self.query(query)
                query = "DELETE FROM {} WHERE {} = {};".format(table, table_to_id[table], id_)
                self.query(query)
            elif table == 'institutions':
                query = "SELECT * FROM positions WHERE inst_id = {};".format(id_)
                result = self.query(query)
                for r in result:
                    query = "SELECT * FROM experiences WHERE position_id = {};".format(r['position_id'])
                    result_ = self.query(query)
                    for r_ in result_:
                        query = "SELECT * FROM skills WHERE experience_id = {};".format(r_['experience_id'])
                        result__ = self.query(query)
                        for r__ in result__:
                            query = "DELETE FROM {} WHERE {} = {};".format('skills', 'skill_id', r__['skill_id'])
                            self.query(query)
                        query = "DELETE FROM {} WHERE {} = {};".format('experiences', 'experience_id',
                                                                       r_['experience_id'])
                        self.query(query)
                    query = "DELETE FROM {} WHERE {} = {};".format('positions', 'position_id', r['position_id'])
                    self.query(query)
                query = "DELETE FROM {} WHERE {} = {};".format(table, table_to_id[table], id_)
                self.query(query)


    def modifyRows(self, table, ids_dict):
        # modifys rows of a given table provided a dict like this: {id1: {attr1: newval1, attr2: newval2}, id2: ... }
        table_to_id = {'experiences': 'experience_id', 'institutions': 'inst_id', 'positions': 'position_id',
                       'skills': 'skill_id', 'boards': 'board_id', 'boardemails': 'boardemail_id',
                       'boardlists': 'boardlist_id', 'cards': 'card_id'}
                       # map table name to what the id attribute is called
        for id_, attr_to_value in ids_dict.items():
            query = "UPDATE {} SET {} WHERE {} = {};"\
                .format(table, ','.join([k + "='" + str(v) + "'" if v is not None else k + "=" + 'NULL'
                                         for k, v in attr_to_value.items()]),
                        table_to_id[table], id_)
            self.query(query)

    def getResumeData(self):
        # Pulls data from the database to generate data like this:
        # return {1: {'address' : 'NULL',
        #                 'city': 'East Lansing',
        #                'state': 'Michigan',
        #                 'type': 'Academia',
        #                  'zip': 'NULL',
        #           'department': 'Computer Science',
        #                 'name': 'Michigan State University',
        #            'positions': {1: {'end_date'        : None,
        #                              'responsibilities': 'Teach classes; mostly NLP and Web design.',
        #                              'start_date'      : datetime.date(2020, 1, 1),
        #                              'title'           : 'Instructor',
        #                              'experiences': {1: {'description' : 'Taught an introductory course ... ',
        #                                                     'end_date' : None,
        #                                                    'hyperlink' : 'https://gitlab.msu.edu',
        #                                                         'name' : 'CSE 477',
        #                                                       'skills' : {},
        #                                                   'start_date' : None
        #                                                 },
        #                                              2: {'description' : 'introduction to NLP ...',
        #                                                     'end_date' : None,
        #                                                     'hyperlink': 'NULL',
        #                                                     'name'     : 'CSE 847',
        #                                                     'skills': {1: {'name'        : 'Javascript',
        #                                                                    'skill_level' : 7},
        #                                                                2: {'name'        : 'Python',
        #                                                                    'skill_level' : 10},
        #                                                                3: {'name'        : 'HTML',
        #                                                                    'skill_level' : 9},
        #                                                                4: {'name'        : 'CSS',
        #                                                                    'skill_level' : 5}},
        #                                                     'start_date': None
        #                                                 }
        #                                             }}}}}
        query = "SELECT * FROM institutions;"
        result = self.query(query)
        # institutions level
        data = {}
        for r in result:
            inst_id = r['inst_id']  # store relevant id for later use
            data[inst_id] = {k:v for k,v in r.items() if k != 'inst_id'}  # populate this level

            # positions level, repeat steps from above
            data[inst_id]['positions'] = {}
            query_ = f"SELECT * FROM positions WHERE inst_id = {inst_id};"
            result_ = self.query(query_)
            for r_ in result_:
                position_id = r_['position_id']
                data[inst_id]['positions'][position_id] = \
                    {k_:v_ for k_,v_ in r_.items() if k_ != 'position_id' and k_ != 'inst_id'}

                # experiences level
                data[inst_id]['positions'][position_id]['experiences'] = {}
                query__ = f"SELECT * FROM experiences WHERE position_id = {position_id};"
                result__ = self.query(query__)
                for r__ in result__:
                    experience_id = r__['experience_id']
                    data[inst_id]['positions'][position_id]['experiences'][experience_id] = \
                        {k__:v__ for k__,v__ in r__.items() if k__ != 'experience_id' and k__ != 'position_id'}

                    # skills (final) level
                    data[inst_id]['positions'][position_id]['experiences'][experience_id]['skills'] = {}
                    query___ = f"SELECT * FROM skills WHERE experience_id = {experience_id};"
                    result___ = self.query(query___)
                    for r___ in result___:
                        skill_id = r___['skill_id']
                        data[inst_id]['positions'][position_id]['experiences'][experience_id]['skills'][skill_id] = \
                            {k___:v___ for k___,v___ in r___.items() if k___ != 'skill_id' and k___ != 'experience_id'}

                        # All done! Phew!

        return data

    def getBoardData(self):
        query = "SELECT * FROM boards;"
        result = self.query(query)
        # boards level
        data = {}
        for r in result:
            board_id = r['board_id']  # store relevant id for later use
            data[board_id] = {k: v for k, v in r.items() if k != 'board_id'}  # populate this level

            # lists and emails level, repeat steps from above
            data[board_id]['emails'] = {}
            query_ = f"SELECT * FROM boardemails WHERE board_id = {board_id};"
            result_ = self.query(query_)
            for r_ in result_:
                boardemail_id = r_['boardemail_id']
                data[board_id]['emails'][boardemail_id] = \
                    {k_: v_ for k_, v_ in r_.items() if k_ != 'boardemail_id' and k_ != 'board_id'}

            data[board_id]['lists'] = {}
            query_ = f"SELECT * FROM boardlists WHERE board_id = {board_id};"
            result_ = self.query(query_)
            for r_ in result_:
                boardlist_id = r_['boardlist_id']
                data[board_id]['lists'][boardlist_id] = \
                    {k_: v_ for k_, v_ in r_.items() if k_ != 'boardlist_id' and k_ != 'board_id'}

                # cards level
                data[board_id]['lists'][boardlist_id]['cards'] = {}
                query__ = f"SELECT * FROM cards WHERE boardlist_id = {boardlist_id};"
                result__ = self.query(query__)
                for r__ in result__:
                    card_id = r__['card_id']
                    data[board_id]['lists'][boardlist_id]['cards'][card_id] = \
                        {k__: v__ for k__, v__ in r__.items() if k__ != 'card_id' and k__ != 'boardlist_id'}

        return data

    def checkBoardMembership(self, board_id, email):
        if email == 'Unknown':
            return False
        query = f"SELECT email FROM boardemails WHERE board_id = '{board_id}';"
        result = self.query(query)
        for r in result:
            if r['email'] == email:
                return True
        return False

#######################################################################################
# AUTHENTICATION RELATED
#######################################################################################
    def createUser(self, email='me@email.com', password='password', role='user'):
        query = f"SELECT * FROM users WHERE email = '{email}';"
        result = self.query(query)
        if not result:
            self.insertRows('users', ['email', 'password', 'role'], [[email, self.onewayEncrypt(password), role]])
            return {'success': 1}
        return {'success': 0}

    def authenticate(self, email='me@email.com', password='password'):
        query = f"SELECT * FROM users WHERE email = '{email}' AND password = '{self.onewayEncrypt(password)}';"
        result = self.query(query)
        if result:
            return {'success': 1}
        return {'success': 0}

    def onewayEncrypt(self, string):
        encrypted_string = hashlib.scrypt(string.encode('utf-8'),
                                          salt = self.encryption['oneway']['salt'],
                                          n    = self.encryption['oneway']['n'],
                                          r    = self.encryption['oneway']['r'],
                                          p    = self.encryption['oneway']['p']
                                          ).hex()
        return encrypted_string


    def reversibleEncrypt(self, type, message):
        fernet = Fernet(self.encryption['reversible']['key'])
        
        if type == 'encrypt':
            message = fernet.encrypt(message.encode())
        elif type == 'decrypt':
            message = fernet.decrypt(message).decode()

        return message


