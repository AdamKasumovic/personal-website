# Author: Prof. MM Ghassemi <ghassem3@msu.edu>
from flask import current_app as app
from flask import render_template, redirect, request, session, url_for, copy_current_request_context, abort
from flask_socketio import SocketIO, emit, join_room, leave_room, close_room, rooms, disconnect
from .utils.database.database  import database
from werkzeug.datastructures   import ImmutableMultiDict
from pprint import pprint
import json
import random
import functools
from . import socketio
db = database()


#######################################################################################
# AUTHENTICATION/USER CREATION RELATED
#######################################################################################
def login_required(func):
    @functools.wraps(func)
    def secure_function(*args, **kwargs):
        if "email" not in session:
            return redirect(url_for("login", next=request.url))
        return func(*args, **kwargs)
    return secure_function


# Prevent users from signing up or logging in when logged in via the URL
def not_login_required(func):
    @functools.wraps(func)
    def secure_function(*args, **kwargs):
        if "email" in session:
            return redirect(url_for("home", next=request.url))
        return func(*args, **kwargs)
    return secure_function

def getUser():
	return db.reversibleEncrypt('decrypt', session['email']) if 'email' in session else 'Unknown'

@app.route('/login')
@not_login_required
def login():
	return render_template('login.html', db=db)

@app.route('/logout')
def logout():
    session.pop('email', default=None)
    return redirect('/')

@app.route('/processlogin', methods = ["POST"])
def processlogin():
    form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
    # encrypt email and return successful if email, password checks out in DB, otherwise return unsuccessful
    if bool(db.authenticate(form_fields['email'], form_fields['password'])['success']):
        session['email'] = db.reversibleEncrypt('encrypt', form_fields['email'])
        return json.dumps({'success':1})
    return json.dumps({'success':0})

@app.route('/signup')
@not_login_required
def signup():
    return render_template('signup.html', db=db)

@app.route('/processsignup', methods = ["POST"])
def processsignup():
    form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
    # passwords will be encrypted by the createUser function
    # if successful the user will be added so just return success code, otherwise return failure code
    if bool(db.createUser(form_fields['email'], form_fields['password'], "guest")['success']):
        return json.dumps({'success':1})
    return json.dumps({'success':0})


#######################################################################################
# CHATROOM RELATED
#######################################################################################
@app.route('/chat')
@login_required
def chat():
    return render_template('chat.html', user=getUser(), db=db)

@socketio.on('joined', namespace='/chat')
def joined(message):
    join_room('main')
    get_user = getUser()
    if get_user == 'owner@email.com':
        emit('status',
             {'msg': get_user + ' has entered the room.', 'style': 'overflow-wrap: break-word;color:blue;text-align: right'},
             room='main')
    else:
        emit('status',
             {'msg': get_user + ' has entered the room.', 'style': 'overflow-wrap: break-word;color:gray;text-align: left'},
             room='main')

@socketio.on('leave', namespace='/chat')
def leave(message):
    get_user = getUser()
    if get_user == 'owner@email.com':
        emit('status',
             {'msg': get_user + ' has left the room.', 'style': 'overflow-wrap: break-word;color:blue;text-align: right'},
             room='main')
    else:
        emit('status',
             {'msg': get_user + ' has left the room.', 'style': 'overflow-wrap: break-word;color:gray;text-align: left'},
             room='main')
    leave_room('main')

@socketio.on('send', namespace='/chat')
def send(message):
    get_user = getUser()
    if get_user == 'owner@email.com':
        emit('status',
             {'msg': message, 'style': 'overflow-wrap: break-word;color:blue;text-align: right'},
             room='main')
    else:
        emit('status',
             {'msg': message, 'style': 'overflow-wrap: break-word;color:gray;text-align: left'},
             room='main')

#######################################################################################
# OTHER
#######################################################################################
@app.route('/')
def root():
    return redirect('/home')


@app.route('/home')
def home():
    x = random.choice(['In the past I memorized the first 420 digits of pi, and my phone passcode has been the '
                       'first hundred (with some small changes and additions for security) for four years!',
                       'I had a pet goldfish that lived to be 13 years old!', 'I own the entire Astral Radiance '
                                                                              'Pokémon Trading Card Game set!'])
    return render_template('home.html', fun_fact=x, db=db)


@app.route('/resume')
def resume():
    resume_data = db.getResumeData()
    #pprint(resume_data)
    return render_template('resume.html', resume_data=resume_data, db=db)


@app.route('/processresumeedit', methods = ["POST"])
def processresumeedit():
    try:
        # get and organize website values
        form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
        inst_fields = {}
        pos_fields = {}
        exp_fields = {}
        skl_fields = {}
        for class_name, new_value in form_fields.items():
            comma_loc = class_name.find(',')
            double_dash_loc = class_name.find('--')
            if 'inst--' in class_name:
                # table_name_dict = {(id, attr1): newval1, ...}
                inst_fields[(class_name[comma_loc+1:], class_name[double_dash_loc+2:comma_loc])] = \
                    new_value.replace("'", "''")
            elif 'pos--' in class_name:
                # replace - with _ to match sql table; replace present with null for end_date
                pos_fields[(class_name[comma_loc+1:],
                            class_name[double_dash_loc+2:comma_loc].replace('-', '_'))] = \
                    new_value.replace("'", "''") if new_value != 'Present' else None
            elif 'exp--' in class_name:
                exp_fields[(class_name[comma_loc + 1:], class_name[double_dash_loc + 2:comma_loc])] = \
                    new_value.replace("'", "''")
            elif 'skl--' in class_name:
                skl_fields[(class_name[comma_loc+1:], class_name[double_dash_loc+2:comma_loc])] = \
                    new_value.replace("'", "''")

        # actually modify the rows, this should work well enough that saving unmodified data returns the original data
        table_names = ['institutions', 'positions', 'experiences', 'skills']
        all_fields = [inst_fields, pos_fields, exp_fields, skl_fields]
        for i in range(len(table_names)):
            for id_attr, new_value in all_fields[i].items():
                db.modifyRows(table_names[i], {id_attr[0]: {id_attr[1]: new_value}})

        return json.dumps({'success': 1})

    except:
        return json.dumps({'success': 0})


@app.route('/processresumedelete', methods = ["POST"])
def processresumedelete():
    try:
        # get and organize website values
        form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
        for table_name, data_id in form_fields.items():
            db.deleteRows(table_name, [data_id])
        return json.dumps({'success': 1})

    except:
        return json.dumps({'success': 0})


@app.route('/processresumeadd', methods = ["POST"])
def processresumeadd():
    try:
        # get and organize website values
        form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
        # default values
        hyperlink = "https://www.google.com"
        department = "NULL"
        address = "NULL"
        city = "NULL"
        state = "NULL"
        zip_ = "NULL"
        # overwrite defaults
        for table_name, actual_item in form_fields.items():
            if table_name == 'hyperlink':
                hyperlink = actual_item
            elif table_name == 'department':
                department = actual_item
            elif table_name == 'address':
                address = actual_item
            elif table_name == 'city':
                city = actual_item
            elif table_name == 'state':
                state = actual_item
            elif table_name == 'zip':
                zip_ = actual_item

        # insert into tables
        for table_name, data_id in form_fields.items():
            if table_name == 'positions':
                db.insertRows(table_name, ['inst_id', 'title', 'responsibilities', 'start_date'],
                              [[data_id, 'Sample Title', 'Sample responsibilities', '2001-09-26']])
            elif table_name == 'experiences':
                db.insertRows(table_name, ['position_id', 'name', 'description', 'hyperlink', 'start_date'],
                              [[data_id, 'Sample Name', 'Sample description', hyperlink, '2001-09-26']])
            elif table_name == 'skills':
                db.insertRows(table_name, ['experience_id', 'name', 'skill_level'], [[data_id, 'Sample Name', '10']])
            elif table_name == 'institutions':
                db.insertRows(table_name, ['type', 'name', 'department', 'address', 'city', 'state', 'zip'],
                              [['Sample Type', 'Sample Name', department, address, city, state, zip_]])
        return json.dumps({'success': 1})

    except:
        return json.dumps({'success': 0})


@app.route('/projects')
def projects():
    return render_template('projects.html', db=db)


@app.route('/piano')
def piano():
    return render_template('piano.html', db=db)

@app.route('/simpletrello')
@login_required
def simpletrello():
    board_data = db.getBoardData()
    #pprint(board_data)
    users_boards = set()
    current_email = getUser()
    for board_id in board_data:
        emails = board_data[board_id]['emails']
        for email_id in emails:
            if emails[email_id]['email'] == current_email:
                users_boards.add((board_id, board_data[board_id]['name']))
    users_boards = sorted(list(users_boards), reverse=True)  # sort by most recently created board
    #pprint(users_boards)
    return render_template('simpletrello.html', users_boards=users_boards, db=db)


@app.route('/processboardcreation', methods = ["POST"])
def processboardcreation():
    try:
        form_fields = dict((key, request.form.getlist(key)[0]) for key in list(request.form.keys()))
        db.insertRows('boards', ['name'], [[form_fields['name']]])
        most_recent_board_id = str(db.query("SELECT board_id FROM boards ORDER BY board_id DESC LIMIT 1;")
                                   [0]['board_id'])
        # insert user's email into board
        db.insertRows('boardemails', ['board_id', 'email'], [[most_recent_board_id, getUser()]])
        # insert everyone else's email into board
        if form_fields['emails'] != '[]':
            db.insertRows('boardemails', ['board_id', 'email'], [[most_recent_board_id, other_email]
                                                                 for other_email in
                                                                 set(form_fields['emails'][1:-1]
                                                                     .replace('"', '').split(','))])
        # insert default lists and cards
        db.insertRows('boardlists', ['board_id', 'name'], [[most_recent_board_id, 'To Do'],
                                                           [most_recent_board_id, 'Doing'],
                                                           [most_recent_board_id, 'Completed']])
        three_most_recent_lists = db.query("SELECT boardlist_id FROM boardlists ORDER BY boardlist_id DESC LIMIT 3;")
        first_list_id = str(three_most_recent_lists[2]['boardlist_id'])
        second_list_id = str(three_most_recent_lists[1]['boardlist_id'])
        third_list_id = str(three_most_recent_lists[0]['boardlist_id'])
        db.insertRows('cards', ['boardlist_id', 'name', 'details'], [[first_list_id, 'Task1', ''],
                                                                     [first_list_id, 'Task2', ''],
                                                                     [second_list_id, 'Task1', ''],
                                                                     [second_list_id, 'Task2', ''],
                                                                     [third_list_id, 'Task1', ''],
                                                                     [third_list_id, 'Task2', '']])
        #pprint(db.getBoardData())
        return json.dumps({'success':1})
    except:
        return json.dumps({'success':0})


@app.route('/board/<board_id>')
def board(board_id):
    if db.checkBoardMembership(board_id, getUser()):
        this_board_data = db.getBoardData()[int(board_id)]
        return render_template('board.html', this_board_data=this_board_data, db=db, board_id=board_id)
    abort(401)  # prevent users from accessing boards they aren't a part of via the URL

@app.errorhandler(401)
def unauthorized(error):
    return render_template('unauthorized.html', db=db), 401

@socketio.on('joined_board', namespace='/board')
def joined_board(joined_board_id):
    room_name = 'board_'+joined_board_id
    #print(room_name)
    join_room(room_name)
    get_user = getUser()
    emit('board_status',
         {'msg': get_user + ' has entered the room.',
          'style': 'overflow-wrap: break-word;color:black;text-align: left;font-style:italic;'},
         room=room_name)

@socketio.on('board_send', namespace='/board')
def board_send(message):
    get_user = getUser()
    emit('board_status',
         {'msg': get_user + ': ' + message['text_value'],
          'style': 'overflow-wrap: break-word;color:black;text-align: left;'},
         room='board_'+message['board_id'])

@socketio.on('board_leave', namespace='/board')
def board_leave(message):
    get_user = getUser()
    emit('board_status',
         {'msg': get_user + ' has left the room.',
          'style': 'overflow-wrap: break-word;color:black;text-align: left;font-style:italic;'},
         room='board_'+message)
    leave_room('board_'+message)

@socketio.on('send_details', namespace='/board')
def send_details(details_json):
    # Live stuff, don't let the contenteditables be empty
    if int(details_json['card_id']) % 2 == 1:
        default_details = 'Task1 details here!'
    else:
        default_details = 'Task2 details here!'
    emit('update_details',
         {'text_content': details_json['text_content'] if details_json['text_content'] else default_details,
          'card_id': details_json['card_id']}, room='board_'+details_json['board_id'])
    # Persistent stuff, empty details are fine
    db.modifyRows('cards', {int(details_json['card_id']):
                                {'details': details_json['text_content'] if details_json['text_content'] else ''}})

@socketio.on('move_details', namespace='/board')
def move_details(details_json):
    # Live stuff, don't let the contenteditables be empty
    if int(details_json['card_id']) % 2 == 1:
        default_details = 'Task1 details here!'
    else:
        default_details = 'Task2 details here!'
    emit('update_details',
         {'text_content': default_details,
          'card_id': details_json['card_id']}, room='board_' + details_json['board_id'])
    emit('update_details',
         {'text_content': details_json['text_content'] if details_json['text_content'] else default_details,
          'card_id': str(int(details_json['card_id'])+details_json['card_count'])}, room='board_'+details_json['board_id'])
    # Persistent stuff, empty details are fine
    db.modifyRows('cards', {int(details_json['card_id']): {'details': ''}})
    db.modifyRows('cards', {(int(details_json['card_id'])+details_json['card_count']):
                                {'details': details_json['text_content'] if details_json['text_content'] else ''}})


@app.route('/processfeedback', methods = ['POST'])
def processfeedback():
    feedback = request.form.to_dict()
    keys = []
    values = [[]]
    for k, v in feedback.items():
        keys.append(k)
        values[0].append(v)
    db.insertRows('feedback', keys, values)
    query = "SELECT * FROM feedback;"
    feedback_full = db.query(query)
    return render_template('processfeedback.html', feedback=feedback_full, db=db)


# Clears the feedback table for use in submitting/debugging
@app.route('/clearfeedback')
def clearfeedback():
    query = "TRUNCATE TABLE feedback;"
    db.query(query)
    return redirect('/home')


@app.route("/static/<path:path>")
def static_dir(path):
    return send_from_directory("static", path)

@app.after_request
def add_header(r):
    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, public, max-age=0"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    return r
