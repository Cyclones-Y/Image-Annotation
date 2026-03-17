-- ----------------------------
-- 1、部门表
-- ----------------------------
drop table if exists sys_dept;
create table sys_dept (
    dept_id bigserial,
    parent_id bigint default 0,
    ancestors varchar(50) default '',
    dept_name varchar(30) default '',
    order_num int4 default 0,
    leader varchar(20) default null,
    phone varchar(11) default null,
    email varchar(50) default null,
    status char(1) default '0',
    del_flag char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    primary key (dept_id)
);
alter sequence sys_dept_dept_id_seq restart 200;
comment on column sys_dept.dept_id is '部门id';
comment on column sys_dept.parent_id is '父部门id';
comment on column sys_dept.ancestors is '祖级列表';
comment on column sys_dept.dept_name is '部门名称';
comment on column sys_dept.order_num is '显示顺序';
comment on column sys_dept.leader is '负责人';
comment on column sys_dept.phone is '联系电话';
comment on column sys_dept.email is '邮箱';
comment on column sys_dept.status is '部门状态（0正常 1停用）';
comment on column sys_dept.del_flag is '删除标志（0代表存在 2代表删除）';
comment on column sys_dept.create_by is '创建者';
comment on column sys_dept.create_time is '创建时间';
comment on column sys_dept.update_by is '更新者';
comment on column sys_dept.update_time is '更新时间';
comment on table sys_dept is '部门表';

-- ----------------------------
-- 初始化-部门表数据
-- ----------------------------
insert into sys_dept values(100,  0,   '0',          '集团总公司',   0, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(101,  100, '0,100',      '深圳分公司', 1, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(102,  100, '0,100',      '长沙分公司', 2, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(103,  101, '0,100,101',  '研发部门',   1, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(104,  101, '0,100,101',  '市场部门',   2, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(105,  101, '0,100,101',  '测试部门',   3, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(106,  101, '0,100,101',  '财务部门',   4, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(107,  101, '0,100,101',  '运维部门',   5, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(108,  102, '0,100,102',  '市场部门',   1, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);
insert into sys_dept values(109,  102, '0,100,102',  '财务部门',   2, '年糕', '15888888888', 'niangao@qq.com', '0', '0', 'admin', current_timestamp, '', null);

-- ----------------------------
-- 2、用户信息表
-- ----------------------------
drop table if exists sys_user;
create table sys_user (
    user_id bigserial not null,
    dept_id bigint default null,
    user_name varchar(30) not null,
    nick_name varchar(30) not null,
    user_type varchar(2) default '00',
    email varchar(50) default '',
    phonenumber varchar(11) default '',
    sex char(1) default '0',
    avatar varchar(100) default '',
    password varchar(100) default '',
    status char(1) default '0',
    del_flag char(1) default '0',
    login_ip varchar(128) default '',
    login_date timestamp(0),
    pwd_update_date timestamp(0),
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (user_id)
);
alter sequence sys_user_user_id_seq restart 100;
comment on column sys_user.user_id is '用户ID';
comment on column sys_user.dept_id is '部门ID';
comment on column sys_user.user_name is '用户账号';
comment on column sys_user.nick_name is '用户昵称';
comment on column sys_user.user_type is '用户类型（00系统用户）';
comment on column sys_user.email is '用户邮箱';
comment on column sys_user.phonenumber is '手机号码';
comment on column sys_user.sex is '用户性别（0男 1女 2未知）';
comment on column sys_user.avatar is '头像地址';
comment on column sys_user.password is '密码';
comment on column sys_user.status is '帐号状态（0正常 1停用）';
comment on column sys_user.del_flag is '删除标志（0代表存在 2代表删除）';
comment on column sys_user.login_ip is '最后登录IP';
comment on column sys_user.login_date is '最后登录时间';
comment on column sys_user.pwd_update_date is '密码最后更新时间';
comment on column sys_user.create_by is '创建者';
comment on column sys_user.create_time is '创建时间';
comment on column sys_user.update_by is '更新者';
comment on column sys_user.update_time is '更新时间';
comment on column sys_user.remark is '备注';
comment on table sys_user is '用户信息表';

-- ----------------------------
-- 初始化-用户信息表数据
-- ----------------------------
insert into sys_user values(1,  103, 'admin',   '超级管理员', '00', 'niangao@163.com', '15888888888', '1', '', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '0', '0', '127.0.0.1', current_timestamp, current_timestamp, 'admin', current_timestamp, '', null, '管理员');
insert into sys_user values(2,  105, 'niangao', '年糕', 			'00', 'niangao@qq.com',  '15666666666', '1', '', '$2a$10$7JB720yubVSZvUI0rEqK/.VqGOZTH.ulu33dHOiBE8ByOhJIrdAu2', '0', '0', '127.0.0.1', current_timestamp, current_timestamp, 'admin', current_timestamp, '', null, '测试员');

-- ----------------------------
-- 3、岗位信息表
-- ----------------------------
drop table if exists sys_post;
create table sys_post (
    post_id bigserial not null,
    post_code varchar(64) not null,
    post_name varchar(50) not null,
    post_sort int4 not null,
    status char(1) not null,
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (post_id)
);
alter sequence sys_post_post_id_seq restart 5;
comment on column sys_post.post_id is '岗位ID';
comment on column sys_post.post_code is '岗位编码';
comment on column sys_post.post_name is '岗位名称';
comment on column sys_post.post_sort is '显示顺序';
comment on column sys_post.status is '状态（0正常 1停用）';
comment on column sys_post.create_by is '创建者';
comment on column sys_post.create_time is '创建时间';
comment on column sys_post.update_by is '更新者';
comment on column sys_post.update_time is '更新时间';
comment on column sys_post.remark is '备注';
comment on table sys_post is '岗位信息表';

-- ----------------------------
-- 初始化-岗位信息表数据
-- ----------------------------
insert into sys_post values(1, 'ceo',  '董事长',    1, '0', 'admin', current_timestamp, '', null, '');
insert into sys_post values(2, 'se',   '项目经理',  2, '0', 'admin', current_timestamp, '', null, '');
insert into sys_post values(3, 'hr',   '人力资源',  3, '0', 'admin', current_timestamp, '', null, '');
insert into sys_post values(4, 'user', '普通员工',  4, '0', 'admin', current_timestamp, '', null, '');

-- ----------------------------
-- 4、角色信息表
-- ----------------------------
drop table if exists sys_role;
create table sys_role (
    role_id bigserial not null,
    role_name varchar(30) not null,
    role_key varchar(100) not null,
    role_sort int4 not null,
    data_scope char(1) default '1',
    menu_check_strictly smallint default 1,
    dept_check_strictly smallint default 1,
    status char(1) not null,
    del_flag char(1) default '0',
    create_by varchar(64)  default '',
    create_time timestamp(0),
    update_by varchar(64)  default '',
    update_time timestamp(0),
    remark varchar(500)  default null,
    primary key (role_id)
);
alter sequence sys_role_role_id_seq restart 3;
comment on column sys_role.role_id is '角色ID';
comment on column sys_role.role_name is '角色名称';
comment on column sys_role.role_key is '角色权限字符串';
comment on column sys_role.role_sort is '显示顺序';
comment on column sys_role.data_scope is '数据范围（1：全部数据权限 2：自定数据权限 3：本部门数据权限 4：本部门及以下数据权限）';
comment on column sys_role.menu_check_strictly is '菜单树选择项是否关联显示';
comment on column sys_role.dept_check_strictly is '部门树选择项是否关联显示';
comment on column sys_role.status is '角色状态（0正常 1停用）';
comment on column sys_role.del_flag is '删除标志（0代表存在 2代表删除）';
comment on column sys_role.create_by is '创建者';
comment on column sys_role.create_time is '创建时间';
comment on column sys_role.update_by is '更新者';
comment on column sys_role.update_time is '更新时间';
comment on column sys_role.remark is '备注';
comment on table sys_role is '角色信息表';

-- ----------------------------
-- 初始化-角色信息表数据
-- ----------------------------
insert into sys_role values(1, '超级管理员',  'admin',  1, 1, 1, 1, '0', '0', 'admin', current_timestamp, '', null, '超级管理员');
insert into sys_role values(2, '普通角色',    'common', 2, 2, 1, 1, '0', '0', 'admin', current_timestamp, '', null, '普通角色');

-- ----------------------------
-- 5、菜单权限表
-- ----------------------------
drop table if exists sys_menu;
create table sys_menu (
    menu_id bigserial not null,
    menu_name varchar(50) not null,
    parent_id bigint default 0,
    order_num int4 default 0,
    path varchar(200) default '',
    component varchar(255) default null,
    query varchar(255) default null,
    route_name varchar(50) default '',
    is_frame int4 default 1,
    is_cache int4 default 0,
    menu_type char(1) default '',
    visible char(1) default '0',
    status char(1) default '0',
    perms varchar(100) default null,
    icon varchar(100) default '#',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default '',
    primary key (menu_id)
);
alter sequence sys_menu_menu_id_seq restart 2000;
comment on column sys_menu.menu_id is '菜单ID';
comment on column sys_menu.menu_name is '菜单名称';
comment on column sys_menu.parent_id is '父菜单ID';
comment on column sys_menu.order_num is '显示顺序';
comment on column sys_menu.path is '路由地址';
comment on column sys_menu.component is '组件路径';
comment on column sys_menu.query is '路由参数';
comment on column sys_menu.route_name is '路由名称';
comment on column sys_menu.is_frame is '是否为外链（0是 1否）';
comment on column sys_menu.is_cache is '是否缓存（0缓存 1不缓存）';
comment on column sys_menu.menu_type is '菜单类型（M目录 C菜单 F按钮）';
comment on column sys_menu.visible is '菜单状态（0显示 1隐藏）';
comment on column sys_menu.status is '菜单状态（0正常 1停用）';
comment on column sys_menu.perms is '权限标识';
comment on column sys_menu.icon is '菜单图标';
comment on column sys_menu.create_by is '创建者';
comment on column sys_menu.create_time is '创建时间';
comment on column sys_menu.update_by is '更新者';
comment on column sys_menu.update_time is '更新时间';
comment on column sys_menu.remark is '备注';
comment on table sys_menu is '菜单权限表';

-- ----------------------------
-- 初始化-菜单信息表数据
-- ----------------------------
-- 一级菜单
insert into sys_menu values(1,  '系统管理', 0, '1',  'system',           null, '', '', 1, 0, 'M', '0', '0', '', 'system',   'admin', current_timestamp, '', null, '系统管理目录');
insert into sys_menu values(2,  '系统监控', 0, '2',  'monitor',          null, '', '', 1, 0, 'M', '0', '0', '', 'monitor',  'admin', current_timestamp, '', null, '系统监控目录');
insert into sys_menu values(3,  '系统工具', 0, '3',  'tool',             null, '', '', 1, 0, 'M', '0', '0', '', 'tool',     'admin', current_timestamp, '', null, '系统工具目录');
insert into sys_menu values(4,  'AI 管理', 0, '4',  'ai',               null, '', '', 1, 0, 'M', '0', '0', '', 'bug',      'admin', current_timestamp, '', null, 'AI 管理目录');
insert into sys_menu values(99, '若依官网', 0, '99', 'http://ruoyi.vip', null, '', '', 0, 0, 'M', '0', '0', '', 'guide',    'admin', current_timestamp, '', null, '若依官网地址');
-- 二级菜单
insert into sys_menu values(100,  '用户管理', 1,   '1', 'user',       'system/user/index',        '', '', 1, 0, 'C', '0', '0', 'system:user:list',        'user',          'admin', current_timestamp, '', null, '用户管理菜单');
insert into sys_menu values(101,  '角色管理', 1,   '2', 'role',       'system/role/index',        '', '', 1, 0, 'C', '0', '0', 'system:role:list',        'peoples',       'admin', current_timestamp, '', null, '角色管理菜单');
insert into sys_menu values(102,  '菜单管理', 1,   '3', 'menu',       'system/menu/index',        '', '', 1, 0, 'C', '0', '0', 'system:menu:list',        'tree-table',    'admin', current_timestamp, '', null, '菜单管理菜单');
insert into sys_menu values(103,  '部门管理', 1,   '4', 'dept',       'system/dept/index',        '', '', 1, 0, 'C', '0', '0', 'system:dept:list',        'tree',          'admin', current_timestamp, '', null, '部门管理菜单');
insert into sys_menu values(104,  '岗位管理', 1,   '5', 'post',       'system/post/index',        '', '', 1, 0, 'C', '0', '0', 'system:post:list',        'post',          'admin', current_timestamp, '', null, '岗位管理菜单');
insert into sys_menu values(105,  '字典管理', 1,   '6', 'dict',       'system/dict/index',        '', '', 1, 0, 'C', '0', '0', 'system:dict:list',        'dict',          'admin', current_timestamp, '', null, '字典管理菜单');
insert into sys_menu values(106,  '参数设置', 1,   '7', 'config',     'system/config/index',      '', '', 1, 0, 'C', '0', '0', 'system:config:list',      'edit',          'admin', current_timestamp, '', null, '参数设置菜单');
insert into sys_menu values(107,  '通知公告', 1,   '8', 'notice',     'system/notice/index',      '', '', 1, 0, 'C', '0', '0', 'system:notice:list',      'message',       'admin', current_timestamp, '', null, '通知公告菜单');
insert into sys_menu values(108,  '日志管理', 1,   '9', 'log',        '',                         '', '', 1, 0, 'M', '0', '0', '',                        'log',           'admin', current_timestamp, '', null, '日志管理菜单');
insert into sys_menu values(109,  '在线用户', 2,   '1', 'online',     'monitor/online/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:online:list',     'online',        'admin', current_timestamp, '', null, '在线用户菜单');
insert into sys_menu values(110,  '定时任务', 2,   '2', 'job',        'monitor/job/index',        '', '', 1, 0, 'C', '0', '0', 'monitor:job:list',        'job',           'admin', current_timestamp, '', null, '定时任务菜单');
insert into sys_menu values(111,  '数据监控', 2,   '3', 'druid',      'monitor/druid/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:druid:list',      'druid',         'admin', current_timestamp, '', null, '数据监控菜单');
insert into sys_menu values(112,  '服务监控', 2,   '4', 'server',     'monitor/server/index',     '', '', 1, 0, 'C', '0', '0', 'monitor:server:list',     'server',        'admin', current_timestamp, '', null, '服务监控菜单');
insert into sys_menu values(113,  '缓存监控', 2,   '5', 'cache',      'monitor/cache/index',      '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis',         'admin', current_timestamp, '', null, '缓存监控菜单');
insert into sys_menu values(114,  '缓存列表', 2,   '6', 'cacheList',  'monitor/cache/list',       '', '', 1, 0, 'C', '0', '0', 'monitor:cache:list',      'redis-list',    'admin', current_timestamp, '', null, '缓存列表菜单');
insert into sys_menu values(115,  '表单构建', 3,   '1', 'build',      'tool/build/index',         '', '', 1, 0, 'C', '0', '0', 'tool:build:list',         'build',         'admin', current_timestamp, '', null, '表单构建菜单');
insert into sys_menu values(116,  '代码生成', 3,   '2', 'gen',        'tool/gen/index',           '', '', 1, 0, 'C', '0', '0', 'tool:gen:list',           'code',          'admin', current_timestamp, '', null, '代码生成菜单');
insert into sys_menu values(117,  '系统接口', 3,   '3', 'swagger',    'tool/swagger/index',       '', '', 1, 0, 'C', '0', '0', 'tool:swagger:list',       'swagger',       'admin', current_timestamp, '', null, '系统接口菜单');
insert into sys_menu values(118,  '模型管理', 4,   '1', 'model',      'ai/model/index',           '', '', 1, 0, 'C', '0', '0', 'ai:model:list',           'form',          'admin', current_timestamp, '', null, '模型管理菜单');
insert into sys_menu values(119,  'AI 对话', 4,   '2', 'chat',       'ai/chat/index',            '', '', 1, 0, 'C', '0', '0', 'ai:chat:list',            'wechat',        'admin', current_timestamp, '', null, 'AI 对话菜单');
-- 三级菜单
insert into sys_menu values(500,  '操作日志', 108, '1', 'operlog',    'monitor/operlog/index',    '', '', 1, 0, 'C', '0', '0', 'monitor:operlog:list',    'form',          'admin', current_timestamp, '', null, '操作日志菜单');
insert into sys_menu values(501,  '登录日志', 108, '2', 'logininfor', 'monitor/logininfor/index', '', '', 1, 0, 'C', '0', '0', 'monitor:logininfor:list', 'logininfor',    'admin', current_timestamp, '', null, '登录日志菜单');
-- 用户管理按钮
insert into sys_menu values(1000, '用户查询', 100, '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1001, '用户新增', 100, '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1002, '用户修改', 100, '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1003, '用户删除', 100, '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:remove',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1004, '用户导出', 100, '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:export',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1005, '用户导入', 100, '6',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:import',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1006, '重置密码', 100, '7',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:user:resetPwd',       '#', 'admin', current_timestamp, '', null, '');
-- 角色管理按钮
insert into sys_menu values(1007, '角色查询', 101, '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1008, '角色新增', 101, '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1009, '角色修改', 101, '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1010, '角色删除', 101, '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:remove',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1011, '角色导出', 101, '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:role:export',         '#', 'admin', current_timestamp, '', null, '');
-- 菜单管理按钮
insert into sys_menu values(1012, '菜单查询', 102, '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1013, '菜单新增', 102, '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1014, '菜单修改', 102, '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1015, '菜单删除', 102, '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:menu:remove',         '#', 'admin', current_timestamp, '', null, '');
-- 部门管理按钮
insert into sys_menu values(1016, '部门查询', 103, '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1017, '部门新增', 103, '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1018, '部门修改', 103, '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1019, '部门删除', 103, '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:dept:remove',         '#', 'admin', current_timestamp, '', null, '');
-- 岗位管理按钮
insert into sys_menu values(1020, '岗位查询', 104, '1',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1021, '岗位新增', 104, '2',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1022, '岗位修改', 104, '3',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1023, '岗位删除', 104, '4',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:remove',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1024, '岗位导出', 104, '5',  '', '', '', '', 1, 0, 'F', '0', '0', 'system:post:export',         '#', 'admin', current_timestamp, '', null, '');
-- 字典管理按钮
insert into sys_menu values(1025, '字典查询', 105, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1026, '字典新增', 105, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1027, '字典修改', 105, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1028, '字典删除', 105, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:remove',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1029, '字典导出', 105, '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:dict:export',         '#', 'admin', current_timestamp, '', null, '');
-- 参数设置按钮
insert into sys_menu values(1030, '参数查询', 106, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:query',        '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1031, '参数新增', 106, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:add',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1032, '参数修改', 106, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:edit',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1033, '参数删除', 106, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:remove',       '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1034, '参数导出', 106, '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:config:export',       '#', 'admin', current_timestamp, '', null, '');
-- 通知公告按钮
insert into sys_menu values(1035, '公告查询', 107, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:query',        '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1036, '公告新增', 107, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:add',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1037, '公告修改', 107, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:edit',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1038, '公告删除', 107, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'system:notice:remove',       '#', 'admin', current_timestamp, '', null, '');
-- 操作日志按钮
insert into sys_menu values(1039, '操作查询', 500, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:query',      '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1040, '操作删除', 500, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:remove',     '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1041, '日志导出', 500, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:operlog:export',     '#', 'admin', current_timestamp, '', null, '');
-- 登录日志按钮
insert into sys_menu values(1042, '登录查询', 501, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:query',   '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1043, '登录删除', 501, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:remove',  '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1044, '日志导出', 501, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:export',  '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1045, '账户解锁', 501, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:logininfor:unlock',  '#', 'admin', current_timestamp, '', null, '');
-- 在线用户按钮
insert into sys_menu values(1046, '在线查询', 109, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:query',       '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1047, '批量强退', 109, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:batchLogout', '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1048, '单条强退', 109, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:online:forceLogout', '#', 'admin', current_timestamp, '', null, '');
-- 定时任务按钮
insert into sys_menu values(1049, '任务查询', 110, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:query',          '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1050, '任务新增', 110, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:add',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1051, '任务修改', 110, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:edit',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1052, '任务删除', 110, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:remove',         '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1053, '状态修改', 110, '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:changeStatus',   '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1054, '任务导出', 110, '6', '#', '', '', '', 1, 0, 'F', '0', '0', 'monitor:job:export',         '#', 'admin', current_timestamp, '', null, '');
-- 代码生成按钮
insert into sys_menu values(1055, '生成查询', 116, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:query',             '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1056, '生成修改', 116, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:edit',              '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1057, '生成删除', 116, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:remove',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1058, '导入代码', 116, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:import',            '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1059, '预览代码', 116, '5', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:preview',           '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1060, '生成代码', 116, '6', '#', '', '', '', 1, 0, 'F', '0', '0', 'tool:gen:code',              '#', 'admin', current_timestamp, '', null, '');
-- 模型管理按钮
insert into sys_menu values(1061, '模型查询', 118, '1', '#', '', '', '', 1, 0, 'F', '0', '0', 'ai:model:query',             '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1062, '模型新增', 118, '2', '#', '', '', '', 1, 0, 'F', '0', '0', 'ai:model:add',               '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1063, '模型修改', 118, '3', '#', '', '', '', 1, 0, 'F', '0', '0', 'ai:model:edit',              '#', 'admin', current_timestamp, '', null, '');
insert into sys_menu values(1064, '模型删除', 118, '4', '#', '', '', '', 1, 0, 'F', '0', '0', 'ai:model:remove',            '#', 'admin', current_timestamp, '', null, '');

-- ----------------------------
-- 6、用户和角色关联表  用户N-1角色
-- ----------------------------
drop table if exists sys_user_role;
create table sys_user_role (
    user_id bigint not null,
    role_id bigint not null,
    primary key (user_id, role_id)
);
comment on column sys_user_role.user_id is '用户ID';
comment on column sys_user_role.role_id is '角色ID';
comment on table sys_user_role is '用户和角色关联表';

-- ----------------------------
-- 初始化-用户和角色关联表数据
-- ----------------------------
insert into sys_user_role values (1, 1);
insert into sys_user_role values (2, 2);

-- ----------------------------
-- 7、角色和菜单关联表  角色1-N菜单
-- ----------------------------
drop table if exists sys_role_menu;
create table sys_role_menu (
    role_id bigint not null,
    menu_id bigint not null,
    primary key (role_id, menu_id)
);
comment on column sys_role_menu.role_id is '角色ID';
comment on column sys_role_menu.menu_id is '菜单ID';
comment on table sys_role_menu is '角色和菜单关联表';

-- ----------------------------
-- 初始化-角色和菜单关联表数据
-- ----------------------------
insert into sys_role_menu values (2, 1);
insert into sys_role_menu values (2, 2);
insert into sys_role_menu values (2, 3);
insert into sys_role_menu values (2, 4);
insert into sys_role_menu values (2, 100);
insert into sys_role_menu values (2, 101);
insert into sys_role_menu values (2, 102);
insert into sys_role_menu values (2, 103);
insert into sys_role_menu values (2, 104);
insert into sys_role_menu values (2, 105);
insert into sys_role_menu values (2, 106);
insert into sys_role_menu values (2, 107);
insert into sys_role_menu values (2, 108);
insert into sys_role_menu values (2, 109);
insert into sys_role_menu values (2, 110);
insert into sys_role_menu values (2, 111);
insert into sys_role_menu values (2, 112);
insert into sys_role_menu values (2, 113);
insert into sys_role_menu values (2, 114);
insert into sys_role_menu values (2, 115);
insert into sys_role_menu values (2, 116);
insert into sys_role_menu values (2, 117);
insert into sys_role_menu values (2, 500);
insert into sys_role_menu values (2, 501);
insert into sys_role_menu values (2, 1000);
insert into sys_role_menu values (2, 1001);
insert into sys_role_menu values (2, 1002);
insert into sys_role_menu values (2, 1003);
insert into sys_role_menu values (2, 1004);
insert into sys_role_menu values (2, 1005);
insert into sys_role_menu values (2, 1006);
insert into sys_role_menu values (2, 1007);
insert into sys_role_menu values (2, 1008);
insert into sys_role_menu values (2, 1009);
insert into sys_role_menu values (2, 1010);
insert into sys_role_menu values (2, 1011);
insert into sys_role_menu values (2, 1012);
insert into sys_role_menu values (2, 1013);
insert into sys_role_menu values (2, 1014);
insert into sys_role_menu values (2, 1015);
insert into sys_role_menu values (2, 1016);
insert into sys_role_menu values (2, 1017);
insert into sys_role_menu values (2, 1018);
insert into sys_role_menu values (2, 1019);
insert into sys_role_menu values (2, 1020);
insert into sys_role_menu values (2, 1021);
insert into sys_role_menu values (2, 1022);
insert into sys_role_menu values (2, 1023);
insert into sys_role_menu values (2, 1024);
insert into sys_role_menu values (2, 1025);
insert into sys_role_menu values (2, 1026);
insert into sys_role_menu values (2, 1027);
insert into sys_role_menu values (2, 1028);
insert into sys_role_menu values (2, 1029);
insert into sys_role_menu values (2, 1030);
insert into sys_role_menu values (2, 1031);
insert into sys_role_menu values (2, 1032);
insert into sys_role_menu values (2, 1033);
insert into sys_role_menu values (2, 1034);
insert into sys_role_menu values (2, 1035);
insert into sys_role_menu values (2, 1036);
insert into sys_role_menu values (2, 1037);
insert into sys_role_menu values (2, 1038);
insert into sys_role_menu values (2, 1039);
insert into sys_role_menu values (2, 1040);
insert into sys_role_menu values (2, 1041);
insert into sys_role_menu values (2, 1042);
insert into sys_role_menu values (2, 1043);
insert into sys_role_menu values (2, 1044);
insert into sys_role_menu values (2, 1045);
insert into sys_role_menu values (2, 1046);
insert into sys_role_menu values (2, 1047);
insert into sys_role_menu values (2, 1048);
insert into sys_role_menu values (2, 1049);
insert into sys_role_menu values (2, 1050);
insert into sys_role_menu values (2, 1051);
insert into sys_role_menu values (2, 1052);
insert into sys_role_menu values (2, 1053);
insert into sys_role_menu values (2, 1054);
insert into sys_role_menu values (2, 1055);
insert into sys_role_menu values (2, 1056);
insert into sys_role_menu values (2, 1057);
insert into sys_role_menu values (2, 1058);
insert into sys_role_menu values (2, 1059);
insert into sys_role_menu values (2, 1060);

-- ----------------------------
-- 8、角色和部门关联表  角色1-N部门
-- ----------------------------
drop table if exists sys_role_dept;
create table sys_role_dept (
    role_id bigint not null,
    dept_id bigint not null,
    primary key (role_id, dept_id)
);
comment on column sys_role_dept.role_id is '角色ID';
comment on column sys_role_dept.dept_id is '部门ID';
comment on table sys_role_dept is '角色和部门关联表';

-- ----------------------------
-- 初始化-角色和部门关联表数据
-- ----------------------------
insert into sys_role_dept values (2, 100);
insert into sys_role_dept values (2, 101);
insert into sys_role_dept values (2, 105);

-- ----------------------------
-- 9、用户与岗位关联表  用户1-N岗位
-- ----------------------------
drop table if exists sys_user_post;
create table sys_user_post (
    user_id bigint not null,
    post_id bigint not null,
    primary key (user_id, post_id)
);
comment on column sys_user_post.user_id is '用户ID';
comment on column sys_user_post.post_id is '岗位ID';
comment on table sys_user_post is '用户与岗位关联表';

-- ----------------------------
-- 初始化-用户与岗位关联表数据
-- ----------------------------
insert into sys_user_post values (1, 1);
insert into sys_user_post values (2, 2);

-- ----------------------------
-- 10、操作日志记录
-- ----------------------------
drop table if exists sys_oper_log;
create table sys_oper_log (
    oper_id bigserial not null,
    title varchar(50) default '',
    business_type int4 default 0,
    method varchar(100) default '',
    request_method varchar(10) default '',
    operator_type int4 default 0,
    oper_name varchar(50) default '',
    dept_name varchar(50) default '',
    oper_url varchar(255) default '',
    oper_ip varchar(128) default '',
    oper_location varchar(255) default '',
    oper_param varchar(2000) default '',
    json_result varchar(2000) default '',
    status int4 default 0,
    error_msg varchar(2000) default '',
    oper_time timestamp(0),
    cost_time bigint default 0,
    primary key (oper_id)
);
alter sequence sys_oper_log_oper_id_seq restart 100;
create index idx_sys_oper_log_bt on sys_oper_log(business_type);  
create index idx_sys_oper_log_s on sys_oper_log(status);  
create index idx_sys_oper_log_ot on sys_oper_log(oper_time);
comment on column sys_oper_log.oper_id is '日志主键';
comment on column sys_oper_log.title is '模块标题';
comment on column sys_oper_log.business_type is '业务类型（0其它 1新增 2修改 3删除）';
comment on column sys_oper_log.method is '方法名称';
comment on column sys_oper_log.request_method is '请求方式';
comment on column sys_oper_log.operator_type is '操作类别（0其它 1后台用户 2手机端用户）';
comment on column sys_oper_log.oper_name is '操作人员';
comment on column sys_oper_log.dept_name is '部门名称';
comment on column sys_oper_log.oper_url is '请求URL';
comment on column sys_oper_log.oper_ip is '主机地址';
comment on column sys_oper_log.oper_location is '操作地点';
comment on column sys_oper_log.oper_param is '请求参数';
comment on column sys_oper_log.json_result is '返回参数';
comment on column sys_oper_log.status is '操作状态（0正常 1异常）';
comment on column sys_oper_log.error_msg is '错误消息';
comment on column sys_oper_log.oper_time is '操作时间';
comment on column sys_oper_log.cost_time is '消耗时间';
comment on table sys_oper_log is '操作日志记录';

-- ----------------------------
-- 11、字典类型表
-- ----------------------------
drop table if exists sys_dict_type;
create table sys_dict_type (
    dict_id bigserial not null,
    dict_name varchar(100) default '',
    dict_type varchar(100) unique default '',
    status char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (dict_id)
);
alter sequence sys_dict_type_dict_id_seq restart 100;
comment on column sys_dict_type.dict_id is '字典主键';
comment on column sys_dict_type.dict_name is '字典名称';
comment on column sys_dict_type.dict_type is '字典类型';
comment on column sys_dict_type.status is '状态（0正常 1停用）';
comment on column sys_dict_type.create_by is '创建者';
comment on column sys_dict_type.create_time is '创建时间';
comment on column sys_dict_type.update_by is '更新者';
comment on column sys_dict_type.update_time is '更新时间';
comment on column sys_dict_type.remark is '备注';
comment on table sys_dict_type is '字典类型表';

-- ----------------------------
-- 初始化-字典类型表数据
-- ----------------------------
insert into sys_dict_type values(1,  '用户性别',     'sys_user_sex',        '0', 'admin', current_timestamp, '', null, '用户性别列表');
insert into sys_dict_type values(2,  '菜单状态',     'sys_show_hide',       '0', 'admin', current_timestamp, '', null, '菜单状态列表');
insert into sys_dict_type values(3,  '系统开关',     'sys_normal_disable',  '0', 'admin', current_timestamp, '', null, '系统开关列表');
insert into sys_dict_type values(4,  '任务状态',     'sys_job_status',      '0', 'admin', current_timestamp, '', null, '任务状态列表');
insert into sys_dict_type values(5,  '任务分组',     'sys_job_group',       '0', 'admin', current_timestamp, '', null, '任务分组列表');
insert into sys_dict_type values(6,  '任务执行器',   'sys_job_executor',    '0', 'admin', current_timestamp, '', null, '任务执行器列表');
insert into sys_dict_type values(7,  '系统是否',     'sys_yes_no',          '0', 'admin', current_timestamp, '', null, '系统是否列表');
insert into sys_dict_type values(8,  '通知类型',     'sys_notice_type',     '0', 'admin', current_timestamp, '', null, '通知类型列表');
insert into sys_dict_type values(9,  '通知状态', 	 'sys_notice_status',   '0', 'admin', current_timestamp, '', null, '通知状态列表');
insert into sys_dict_type values(10,  '操作类型', 	 'sys_oper_type',       '0', 'admin', current_timestamp, '', null, '操作类型列表');
insert into sys_dict_type values(11, '系统状态',     'sys_common_status',   '0', 'admin', current_timestamp, '', null, '登录状态列表');
insert into sys_dict_type values(12, 'AI模型提供商', 'ai_provider_type',    '0', 'admin', current_timestamp, '', null, 'AI模型提供商列表');

-- ----------------------------
-- 12、字典数据表
-- ----------------------------
drop table if exists sys_dict_data;
create table sys_dict_data (
    dict_code bigserial not null,
    dict_sort int4 default 0,
    dict_label varchar(100) default '',
    dict_value varchar(100) default '',
    dict_type varchar(100) default '',
    css_class varchar(100) default null,
    list_class varchar(100) default null,
    is_default char(1) default 'N',
    status char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (dict_code)
);
alter sequence sys_dict_data_dict_code_seq restart 100;
comment on column sys_dict_data.dict_code is '字典编码';
comment on column sys_dict_data.dict_sort is '字典排序';
comment on column sys_dict_data.dict_label is '字典标签';
comment on column sys_dict_data.dict_value is '字典键值';
comment on column sys_dict_data.dict_type is '字典类型';
comment on column sys_dict_data.css_class is '样式属性（其他样式扩展）';
comment on column sys_dict_data.list_class is '表格回显样式';
comment on column sys_dict_data.is_default is '是否默认（Y是 N否）';
comment on column sys_dict_data.status is '状态（0正常 1停用）';
comment on column sys_dict_data.create_by is '创建者';
comment on column sys_dict_data.create_time is '创建时间';
comment on column sys_dict_data.update_by is '更新者';
comment on column sys_dict_data.update_time is '更新时间';
comment on column sys_dict_data.remark is '备注';
comment on table sys_dict_data is '字典数据表';

-- ----------------------------
-- 初始化-字典数据表数据
-- ----------------------------
insert into sys_dict_data values(1,  1,  '男',               '0',             'sys_user_sex',        '',   '',        'Y', '0', 'admin', current_timestamp, '', null, '性别男');
insert into sys_dict_data values(2,  2,  '女',               '1',             'sys_user_sex',        '',   '',        'N', '0', 'admin', current_timestamp, '', null, '性别女');
insert into sys_dict_data values(3,  3,  '未知',             '2',             'sys_user_sex',        '',   '',        'N', '0', 'admin', current_timestamp, '', null, '性别未知');
insert into sys_dict_data values(4,  1,  '显示',             '0',             'sys_show_hide',       '',   'primary', 'Y', '0', 'admin', current_timestamp, '', null, '显示菜单');
insert into sys_dict_data values(5,  2,  '隐藏',             '1',             'sys_show_hide',       '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '隐藏菜单');
insert into sys_dict_data values(6,  1,  '正常',             '0',             'sys_normal_disable',  '',   'primary', 'Y', '0', 'admin', current_timestamp, '', null, '正常状态');
insert into sys_dict_data values(7,  2,  '停用',             '1',             'sys_normal_disable',  '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '停用状态');
insert into sys_dict_data values(8,  1,  '正常',             '0',              'sys_job_status',      '',   'primary', 'Y', '0', 'admin', current_timestamp, '', null, '正常状态');
insert into sys_dict_data values(9,  2,  '暂停',             '1',              'sys_job_status',      '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '停用状态');
insert into sys_dict_data values(10, 1,  '默认',             'default',        'sys_job_group',       '',   '',        'Y', '0', 'admin', current_timestamp, '', null, '默认分组');
insert into sys_dict_data values(11, 2,  '数据库',           'sqlalchemy',      'sys_job_group',       '',   '',        'N', '0', 'admin', current_timestamp, '', null, '数据库分组');
insert into sys_dict_data values(12, 3,  'redis',           'redis',  			'sys_job_group',       '',   '',        'N', '0', 'admin', current_timestamp, '', null, 'reids分组');
insert into sys_dict_data values(13, 1,  '默认',             'default',  		'sys_job_executor',    '',   '',        'N', '0', 'admin', current_timestamp, '', null, '线程池');
insert into sys_dict_data values(14, 2,  '进程池',           'processpool',     'sys_job_executor',    '',   '',        'N', '0', 'admin', current_timestamp, '', null, '进程池');
insert into sys_dict_data values(15, 1,  '是',               'Y',       		'sys_yes_no',          '',   'primary', 'Y', '0', 'admin', current_timestamp, '', null, '系统默认是');
insert into sys_dict_data values(16, 2,  '否',               'N',       		'sys_yes_no',          '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '系统默认否');
insert into sys_dict_data values(17, 1,  '通知',             '1',       		'sys_notice_type',     '',   'warning', 'Y', '0', 'admin', current_timestamp, '', null, '通知');
insert into sys_dict_data values(18, 2,  '公告',             '2',       		'sys_notice_type',     '',   'success', 'N', '0', 'admin', current_timestamp, '', null, '公告');
insert into sys_dict_data values(19, 1,  '正常',             '0',       		'sys_notice_status',   '',   'primary', 'Y', '0', 'admin', current_timestamp, '', null, '正常状态');
insert into sys_dict_data values(20, 2,  '关闭',             '1',       		'sys_notice_status',   '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '关闭状态');
insert into sys_dict_data values(21, 99, '其他',             '0',       		'sys_oper_type',       '',   'info',    'N', '0', 'admin', current_timestamp, '', null, '其他操作');
insert into sys_dict_data values(22, 1,  '新增',             '1',       		'sys_oper_type',       '',   'info',    'N', '0', 'admin', current_timestamp, '', null, '新增操作');
insert into sys_dict_data values(23, 2,  '修改',             '2',       		'sys_oper_type',       '',   'info',    'N', '0', 'admin', current_timestamp, '', null, '修改操作');
insert into sys_dict_data values(24, 3,  '删除',             '3',       		'sys_oper_type',       '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '删除操作');
insert into sys_dict_data values(25, 4,  '授权',             '4',       		'sys_oper_type',       '',   'primary', 'N', '0', 'admin', current_timestamp, '', null, '授权操作');
insert into sys_dict_data values(26, 5,  '导出',             '5',       		'sys_oper_type',       '',   'warning', 'N', '0', 'admin', current_timestamp, '', null, '导出操作');
insert into sys_dict_data values(27, 6,  '导入',             '6',       		'sys_oper_type',       '',   'warning', 'N', '0', 'admin', current_timestamp, '', null, '导入操作');
insert into sys_dict_data values(28, 7,  '强退',             '7',       		'sys_oper_type',       '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '强退操作');
insert into sys_dict_data values(29, 8,  '生成代码',          '8',       		 'sys_oper_type',       '',   'warning', 'N', '0', 'admin', current_timestamp, '', null, '生成操作');
insert into sys_dict_data values(30, 9,  '清空数据',          '9',       		 'sys_oper_type',       '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '清空操作');
insert into sys_dict_data values(31, 1,  '成功',             '0',       		'sys_common_status',   '',   'primary', 'N', '0', 'admin', current_timestamp, '', null, '正常状态');
insert into sys_dict_data values(32, 2,  '失败',             '1',       		'sys_common_status',   '',   'danger',  'N', '0', 'admin', current_timestamp, '', null, '停用状态');
insert into sys_dict_data values(33, 1,  'AIMLAPI',         'AIMLAPI',          'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'AIMLAPI');
insert into sys_dict_data values(34, 2,  'Anthropic',       'Anthropic',        'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Anthropic');
insert into sys_dict_data values(35, 3,  'Cerebras',        'Cerebras',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Cerebras');
insert into sys_dict_data values(36, 4,  'CerebrasOpenAI',  'CerebrasOpenAI',   'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'CerebrasOpenAI');
insert into sys_dict_data values(37, 5,  'Cohere',          'Cohere',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Cohere');
insert into sys_dict_data values(38, 6,  'CometAPI',        'CometAPI',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'CometAPI');
insert into sys_dict_data values(39, 7,  'DashScope',       'DashScope',        'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'DashScope');
insert into sys_dict_data values(40, 8,  'DeepInfra',       'DeepInfra',        'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'DeepInfra');
insert into sys_dict_data values(41, 9,  'DeepSeek',        'DeepSeek',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'DeepSeek');
insert into sys_dict_data values(42, 10,  'Fireworks',       'Fireworks',        'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Fireworks');
insert into sys_dict_data values(43, 11,  'Google',          'Google',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Google');
insert into sys_dict_data values(44, 12,  'Groq',            'Groq',             'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Groq');
insert into sys_dict_data values(45, 13,  'HuggingFace',     'HuggingFace',      'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'HuggingFace');
insert into sys_dict_data values(46, 14,  'LangDB',          'LangDB',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'LangDB');
insert into sys_dict_data values(47, 15,  'LiteLLM',         'LiteLLM',          'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'LiteLLM');
insert into sys_dict_data values(48, 16,  'LiteLLMOpenAI',   'LiteLLMOpenAI',    'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'LiteLLMOpenAI');
insert into sys_dict_data values(49, 17,  'LlamaCpp',        'LlamaCpp',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'LlamaCpp');
insert into sys_dict_data values(50, 18,  'LMStudio',        'LMStudio',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'LMStudio');
insert into sys_dict_data values(51, 19,  'Meta',            'Meta',             'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Meta');
insert into sys_dict_data values(52, 20,  'Mistral',         'Mistral',          'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Mistral');
insert into sys_dict_data values(53, 21,  'N1N',             'N1N',              'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'N1N');
insert into sys_dict_data values(54, 22,  'Nebius',          'Nebius',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Nebius');
insert into sys_dict_data values(55, 23,  'Nexus',           'Nexus',            'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Nexus');
insert into sys_dict_data values(56, 24,  'Nvidia',          'Nvidia',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Nvidia');
insert into sys_dict_data values(57, 25,  'Ollama',          'Ollama',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Ollama');
insert into sys_dict_data values(58, 26,  'OpenAI',          'OpenAI',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'OpenAI');
insert into sys_dict_data values(59, 27,  'OpenAIResponses', 'OpenAIResponses',  'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'OpenAIResponses');
insert into sys_dict_data values(60, 28,  'OpenRouter',      'OpenRouter',       'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'OpenRouter');
insert into sys_dict_data values(61, 29,  'Perplexity',      'Perplexity',       'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Perplexity');
insert into sys_dict_data values(62, 30,  'Portkey',         'Portkey',          'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Portkey');
insert into sys_dict_data values(63, 31,  'Requesty',        'Requesty',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Requesty');
insert into sys_dict_data values(64, 32,  'Sambanova',       'Sambanova',        'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Sambanova');
insert into sys_dict_data values(65, 33,  'SiliconFlow',     'SiliconFlow',      'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'SiliconFlow');
insert into sys_dict_data values(66, 34,  'Together',        'Together',         'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Together');
insert into sys_dict_data values(67, 35,  'Vercel',          'Vercel',           'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'Vercel');
insert into sys_dict_data values(68, 36,  'VLLM',            'VLLM',             'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'VLLM');
insert into sys_dict_data values(69, 37,  'xAI',             'xAI',              'ai_provider_type',    '',   'info',    'N', '0', 'admin', current_timestamp, '', null, 'xAI');

-- ----------------------------
-- 13、参数配置表
-- ----------------------------
drop table if exists sys_config;
create table sys_config (
    config_id serial not null,
    config_name varchar(100) default '',
    config_key varchar(100) default '',
    config_value varchar(500) default '',
    config_type char(1) default 'N',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (config_id)
);
alter sequence sys_config_config_id_seq restart 100;
comment on column sys_config.config_id is '参数主键';
comment on column sys_config.config_name is '参数名称';
comment on column sys_config.config_key is '参数键名';
comment on column sys_config.config_value is '参数键值';
comment on column sys_config.config_type is '系统内置（Y是 N否）';
comment on column sys_config.create_by is '创建者';
comment on column sys_config.create_time is '创建时间';
comment on column sys_config.update_by is '更新者';
comment on column sys_config.update_time is '更新时间';
comment on column sys_config.remark is '备注';
comment on table sys_config is '参数配置表';

-- ----------------------------
-- 初始化-参数配置表数据
-- ----------------------------
insert into sys_config values(1, '主框架页-默认皮肤样式名称',     'sys.index.skinName',            'skin-blue',     'Y', 'admin', current_timestamp, '', null, '蓝色 skin-blue、绿色 skin-green、紫色 skin-purple、红色 skin-red、黄色 skin-yellow' );
insert into sys_config values(2, '用户管理-账号初始密码',         'sys.user.initPassword',         '123456',        'Y', 'admin', current_timestamp, '', null, '初始化密码 123456' );
insert into sys_config values(3, '主框架页-侧边栏主题',           'sys.index.sideTheme',           'theme-dark',    'Y', 'admin', current_timestamp, '', null, '深色主题theme-dark，浅色主题theme-light' );
insert into sys_config values(4, '账号自助-验证码开关',           'sys.account.captchaEnabled',    'true',          'Y', 'admin', current_timestamp, '', null, '是否开启验证码功能（true开启，false关闭）');
insert into sys_config values(5, '账号自助-是否开启用户注册功能', 'sys.account.registerUser',      'false',         'Y', 'admin', current_timestamp, '', null, '是否开启注册用户功能（true开启，false关闭）');
insert into sys_config values(6, '用户登录-黑名单列表',           'sys.login.blackIPList',         '',              'Y', 'admin', current_timestamp, '', null, '设置登录IP黑名单限制，多个匹配项以;分隔，支持匹配（*通配、网段）');
insert into sys_config values(7, '用户管理-初始密码修改策略',     'sys.account.initPasswordModify',  '1',             'Y', 'admin', current_timestamp, '', null, '0：初始密码修改策略关闭，没有任何提示，1：提醒用户，如果未修改初始密码，则在登录时就会提醒修改密码对话框');
insert into sys_config values(8, '用户管理-账号密码更新周期',     'sys.account.passwordValidateDays', '0',             'Y', 'admin', current_timestamp, '', null, '密码更新周期（填写数字，数据初始化值为0不限制，若修改必须为大于0小于365的正整数），如果超过这个周期登录系统时，则在登录时就会提醒修改密码对话框');

-- ----------------------------
-- 14、系统访问记录
-- ----------------------------
drop table if exists sys_logininfor;
create table sys_logininfor (
    info_id bigserial not null,
    user_name varchar(50) default '',
    ipaddr varchar(128) default '',
    login_location varchar(255) default '',
    browser varchar(50) default '',
    os varchar(50) default '',
    status char(1) default '0',
    msg varchar(255) default '',
    login_time timestamp(0),
    primary key (info_id)
);
alter sequence sys_logininfor_info_id_seq restart 100;
create index idx_sys_logininfor_s on sys_logininfor(status);  
create index idx_sys_logininfor_lt on sys_logininfor(login_time);
comment on column sys_logininfor.info_id is '访问ID';
comment on column sys_logininfor.user_name is '用户账号';
comment on column sys_logininfor.ipaddr is '登录IP地址';
comment on column sys_logininfor.login_location is '登录地点';
comment on column sys_logininfor.browser is '浏览器类型';
comment on column sys_logininfor.os is '操作系统';
comment on column sys_logininfor.status is '登录状态（0成功 1失败）';
comment on column sys_logininfor.msg is '提示消息';
comment on column sys_logininfor.login_time is '访问时间';
comment on table sys_logininfor is '系统访问记录';

-- ----------------------------
-- 15、定时任务调度表
-- ----------------------------
drop table if exists sys_job;
create table sys_job (
    job_id bigserial not null,
    job_name varchar(64) default '',
    job_group varchar(64) default 'default',
    job_executor varchar(64) default 'default',
    invoke_target varchar(500) not null,
    job_args varchar(255) default '',
    job_kwargs varchar(255) default '',
    cron_expression varchar(255) default '',
    misfire_policy varchar(20) default '3',
    concurrent char(1) default '1',
    status char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default '',
    primary key (job_id, job_name, job_group)
);
alter sequence sys_job_job_id_seq restart 100;
comment on column sys_job.job_id is '任务ID';
comment on column sys_job.job_name is '任务名称';
comment on column sys_job.job_group is '任务组名';
comment on column sys_job.job_executor is '任务执行器';
comment on column sys_job.invoke_target is '调用目标字符串';
comment on column sys_job.job_args is '位置参数';
comment on column sys_job.job_kwargs is '关键字参数';
comment on column sys_job.cron_expression is 'cron执行表达式';
comment on column sys_job.misfire_policy is '计划执行错误策略（1立即执行 2执行一次 3放弃执行）';
comment on column sys_job.concurrent is '是否并发执行（0允许 1禁止）';
comment on column sys_job.status is '状态（0正常 1暂停）';
comment on column sys_job.create_by is '创建者';
comment on column sys_job.create_time is '创建时间';
comment on column sys_job.update_by is '更新者';
comment on column sys_job.update_time is '更新时间';
comment on column sys_job.remark is '备注信息';
comment on table sys_job is '定时任务调度表';

-- ----------------------------
-- 初始化-定时任务调度表数据
-- ----------------------------
insert into sys_job values(1, '系统默认（无参）', 'default', 'default', 'module_task.scheduler_test.job', null,   null, '0/10 * * * * ?', '3', '1', '1', 'admin', current_timestamp, '', null, '');
insert into sys_job values(2, '系统默认（有参）', 'default', 'default', 'module_task.scheduler_test.job', 'test', null, '0/15 * * * * ?', '3', '1', '1', 'admin', current_timestamp, '', null, '');
insert into sys_job values(3, '系统默认（多参）', 'default', 'default', 'module_task.scheduler_test.job', 'new',  '{test: 111}', '0/20 * * * * ?', '3', '1', '1', 'admin', current_timestamp, '', null, '');

-- ----------------------------
-- 16、定时任务调度日志表
-- ----------------------------
drop table if exists sys_job_log;
create table sys_job_log (
    job_log_id bigserial not null,
    job_name varchar(64) not null,
    job_group varchar(64) not null,
    job_executor varchar(64) not null,
    invoke_target varchar(500) not null,
    job_args varchar(255) default '',
    job_kwargs varchar(255) default '',
    job_trigger varchar(255) default '',
    job_message varchar(500),
    status char(1) default '0',
    exception_info varchar(2000) default '',
    create_time timestamp(0),
    primary key (job_log_id)
);
comment on column sys_job_log.job_log_id is '任务日志ID';
comment on column sys_job_log.job_name is '任务名称';
comment on column sys_job_log.job_group is '任务组名';
comment on column sys_job_log.job_executor is '任务执行器';
comment on column sys_job_log.invoke_target is '调用目标字符串';
comment on column sys_job_log.job_args is '位置参数';
comment on column sys_job_log.job_kwargs is '关键字参数';
comment on column sys_job_log.job_trigger is '任务触发器';
comment on column sys_job_log.job_message is '日志信息';
comment on column sys_job_log.status is '执行状态（0正常 1失败）';
comment on column sys_job_log.exception_info is '异常信息';
comment on column sys_job_log.create_time is '创建时间';
comment on table sys_job_log is '定时任务调度日志表';

-- ----------------------------
-- 17、通知公告表
-- ----------------------------
drop table if exists sys_notice;
create table sys_notice (
    notice_id serial not null,
    notice_title varchar(50) not null,
    notice_type char(1) not null,
    notice_content bytea default null,
    status char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(255) default null,
    primary key (notice_id)
);
alter sequence sys_notice_notice_id_seq restart 10;
comment on column sys_notice.notice_id is '公告ID';
comment on column sys_notice.notice_title is '公告标题';
comment on column sys_notice.notice_type is '公告类型（1通知 2公告）';
comment on column sys_notice.notice_content is '公告内容';
comment on column sys_notice.status is '公告状态（0正常 1关闭）';
comment on column sys_notice.create_by is '创建者';
comment on column sys_notice.create_time is '创建时间';
comment on column sys_notice.update_by is '更新者';
comment on column sys_notice.update_time is '更新时间';
comment on column sys_notice.remark is '备注';
comment on table sys_notice is '通知公告表';

-- ----------------------------
-- 初始化-公告信息表数据
-- ----------------------------
insert into sys_notice values(1, '温馨提醒：2018-07-01 Image-Annotation 新版本发布啦', '2', '新版本内容', '0', 'admin', current_timestamp, '', null, '管理员');
insert into sys_notice values(2, '维护通知：2018-07-01 Image-Annotation 系统凌晨维护', '1', '维护内容',   '0', 'admin', current_timestamp, '', null, '管理员');

-- ----------------------------
-- 18、代码生成业务表
-- ----------------------------
drop table if exists gen_table;
create table gen_table (
    table_id bigserial not null,
    table_name varchar(200) default '',
    table_comment varchar(500) default '',
    sub_table_name varchar(64) default null,
    sub_table_fk_name varchar(64) default null,
    class_name varchar(100) default '',
    tpl_category varchar(200) default 'crud',
    tpl_web_type varchar(30)  default '',
    package_name varchar(100),
    module_name varchar(30),
    business_name varchar(30),
    function_name varchar(50),
    function_author varchar(50),
    gen_type char(1) default '0',
    gen_path varchar(200) default '/',
    options varchar(1000),
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (table_id)
);
comment on column gen_table.table_id is '编号';
comment on column gen_table.table_name is '表名称';
comment on column gen_table.table_comment is '表描述';
comment on column gen_table.sub_table_name is '关联子表的表名';
comment on column gen_table.sub_table_fk_name is '子表关联的外键名';
comment on column gen_table.class_name is '实体类名称';
comment on column gen_table.tpl_category is '使用的模板（crud单表操作 tree树表操作）';
comment on column gen_table.tpl_web_type is '前端模板类型（element-ui模版 element-plus模版）';
comment on column gen_table.package_name is '生成包路径';
comment on column gen_table.module_name is '生成模块名';
comment on column gen_table.business_name is '生成业务名';
comment on column gen_table.function_name is '生成功能名';
comment on column gen_table.function_author is '生成功能作者';
comment on column gen_table.gen_type is '生成代码方式（0zip压缩包 1自定义路径）';
comment on column gen_table.gen_path is '生成路径（不填默认项目路径）';
comment on column gen_table.options is '其它生成选项';
comment on column gen_table.create_by is '创建者';
comment on column gen_table.create_time is '创建时间';
comment on column gen_table.update_by is '更新者';
comment on column gen_table.update_time is '更新时间';
comment on column gen_table.remark is '备注';
comment on table gen_table is '代码生成业务表';

-- ----------------------------
-- 19、代码生成业务表字段
-- ----------------------------
drop table if exists gen_table_column;
create table gen_table_column (
    column_id bigserial not null,
    table_id bigint,
    column_name varchar(200),
    column_comment varchar(500),
    column_type varchar(100),
    python_type varchar(500),
    python_field varchar(200),
    is_pk char(1),
    is_increment char(1),
    is_required char(1),
    is_unique char(1),
    is_insert char(1),
    is_edit char(1),
    is_list char(1),
    is_query char(1),
    query_type varchar(200) default 'EQ',
    html_type varchar(200),
    dict_type varchar(200) default '',
    sort int4,
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    primary key (column_id)
);
comment on column gen_table_column.column_id is '编号';
comment on column gen_table_column.table_id is '归属表编号';
comment on column gen_table_column.column_name is '列名称';
comment on column gen_table_column.column_comment is '列描述';
comment on column gen_table_column.column_type is '列类型';
comment on column gen_table_column.python_type is 'PYTHON类型';
comment on column gen_table_column.python_field is 'PYTHON字段名';
comment on column gen_table_column.is_pk is '是否主键（1是）';
comment on column gen_table_column.is_increment is '是否自增（1是）';
comment on column gen_table_column.is_required is '是否必填（1是）';
comment on column gen_table_column.is_unique is '是否唯一（1是）';
comment on column gen_table_column.is_insert is '是否为插入字段（1是）';
comment on column gen_table_column.is_edit is '是否编辑字段（1是）';
comment on column gen_table_column.is_list is '是否列表字段（1是）';
comment on column gen_table_column.is_query is '是否查询字段（1是）';
comment on column gen_table_column.query_type is '查询方式（等于、不等于、大于、小于、范围）';
comment on column gen_table_column.html_type is '显示类型（文本框、文本域、下拉框、复选框、单选框、日期控件）';
comment on column gen_table_column.dict_type is '字典类型';
comment on column gen_table_column.sort is '排序';
comment on column gen_table_column.create_by is '创建者';
comment on column gen_table_column.create_time is '创建时间';
comment on column gen_table_column.update_by is '更新者';
comment on column gen_table_column.update_time is '更新时间';
comment on table gen_table_column is '代码生成业务表字段';

-- ----------------------------
-- 20、AI模型表
-- ----------------------------
drop table if exists ai_models;
create table ai_models (
  model_id          bigserial       not null,
  model_code        varchar(100)    not null,
  model_name        varchar(100)    default null,
  provider          varchar(50)     not null,
  model_sort        int4            not null,
  api_key           varchar(255)    default null,
  base_url          varchar(255)    default null,
  model_type        varchar(50)     default null,
  max_tokens        integer         default null,
  temperature       float           default null,
  support_reasoning char(1)         default 'N',
  support_images    char(1)         default 'N',
  status            char(1)         default '0',
  user_id           bigint,
  dept_id           bigint,
  create_by         varchar(64)     default '',
  create_time       timestamp(0),
  update_by         varchar(64)     default '',
  update_time       timestamp(0),
  remark            varchar(500)    default null,
  primary key (model_id)
);
comment on table ai_models is 'AI模型表';
comment on column ai_models.model_id is '模型主键';
comment on column ai_models.model_code is '模型编码';
comment on column ai_models.model_name is '模型名称';
comment on column ai_models.provider is '提供商';
comment on column ai_models.model_sort is '显示顺序';
comment on column ai_models.api_key is 'API Key';
comment on column ai_models.base_url is 'Base URL';
comment on column ai_models.model_type is '模型类型';
comment on column ai_models.max_tokens is '最大输出token';
comment on column ai_models.temperature is '默认温度';
comment on column ai_models.support_reasoning is '是否支持推理';
comment on column ai_models.support_images is '是否支持图片';
comment on column ai_models.status is '模型状态';
comment on column ai_models.user_id is '用户ID';
comment on column ai_models.dept_id is '部门ID';
comment on column ai_models.create_by is '创建者';
comment on column ai_models.create_time is '创建时间';
comment on column ai_models.update_by is '更新者';
comment on column ai_models.update_time is '更新时间';
comment on column ai_models.remark is '备注';

-- ----------------------------
-- 21、AI对话配置表
-- ----------------------------
drop table if exists ai_chat_config;
create table ai_chat_config (
  chat_config_id          bigserial      not null,
  user_id                 bigint         not null unique,
  temperature             float          default null,
  add_history_to_context  char(1)        default '0',
  num_history_runs        int4           default null,
  system_prompt           text           default null,
  metrics_default_visible char(1)        default '0',
  vision_enabled          char(1)        default '1',
  image_max_size_mb       int4           default null,
  create_time             timestamp(0),
  update_time             timestamp(0),
  primary key (chat_config_id)
);
comment on table ai_chat_config is 'AI对话配置表';
comment on column ai_chat_config.chat_config_id is '配置主键';
comment on column ai_chat_config.user_id is '用户ID';
comment on column ai_chat_config.temperature is '默认温度';
comment on column ai_chat_config.add_history_to_context is '是否添加历史记录(0是, 1否)';
comment on column ai_chat_config.num_history_runs is '历史记录条数';
comment on column ai_chat_config.system_prompt is '系统提示词';
comment on column ai_chat_config.metrics_default_visible is '默认显示指标(0是, 1否)';
comment on column ai_chat_config.vision_enabled is '是否开启视觉(0是, 1否)';
comment on column ai_chat_config.image_max_size_mb is '图片最大大小(MB)';
comment on column ai_chat_config.create_time is '创建时间';
comment on column ai_chat_config.update_time is '更新时间';

-- ----------------------------
-- 22、标注项目表
-- ----------------------------
drop table if exists anno_audit_log;
drop table if exists anno_export_item;
drop table if exists anno_export_job;
drop table if exists anno_import_job;
drop table if exists anno_rework_ticket;
drop table if exists anno_qc_result;
drop table if exists anno_qc_item;
drop table if exists anno_qc_task;
drop table if exists anno_annotation_revision;
drop table if exists anno_annotation;
drop table if exists anno_label_attr_option;
drop table if exists anno_label_attr_def;
drop table if exists anno_label_class;
drop table if exists anno_task_item;
drop table if exists anno_task_config;
drop table if exists anno_task;
drop table if exists anno_dataset_item;
drop table if exists anno_dataset;
drop table if exists anno_project_schema;
drop table if exists anno_project_member;
drop table if exists anno_project;

create table anno_project (
    project_id bigserial not null,
    project_code varchar(64) not null,
    project_name varchar(128) not null,
    owner_id bigint not null,
    project_status char(1) default '0',
    deadline timestamp(0),
    config_json jsonb,
    del_flag char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (project_id)
);
create unique index uk_anno_project_code on anno_project(project_code);
create index idx_anno_project_status on anno_project(project_status);
create index idx_anno_project_owner on anno_project(owner_id);
comment on table anno_project is '标注项目表';
comment on column anno_project.project_id is '项目ID';
comment on column anno_project.project_code is '项目编码';
comment on column anno_project.project_name is '项目名称';
comment on column anno_project.owner_id is '项目负责人用户ID';
comment on column anno_project.project_status is '项目状态（0进行中 1已完成 2暂停 3归档）';
comment on column anno_project.deadline is '项目截止时间';
comment on column anno_project.config_json is '项目扩展配置JSON';
comment on column anno_project.del_flag is '删除标志（0代表存在 2代表删除）';
comment on column anno_project.create_by is '创建者';
comment on column anno_project.create_time is '创建时间';
comment on column anno_project.update_by is '更新者';
comment on column anno_project.update_time is '更新时间';
comment on column anno_project.remark is '备注';

create table anno_project_member (
    project_id bigint not null,
    user_id bigint not null,
    project_role varchar(32) not null,
    can_annotate char(1) default '0',
    can_review char(1) default '0',
    can_export char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    primary key (project_id, user_id)
);
create index idx_anno_pm_user on anno_project_member(user_id);
comment on table anno_project_member is '项目成员权限表';
comment on column anno_project_member.project_id is '项目ID';
comment on column anno_project_member.user_id is '用户ID';
comment on column anno_project_member.project_role is '项目角色（owner/manager/annotator/reviewer/viewer）';
comment on column anno_project_member.can_annotate is '是否可标注（0否 1是）';
comment on column anno_project_member.can_review is '是否可质检（0否 1是）';
comment on column anno_project_member.can_export is '是否可导出（0否 1是）';
comment on column anno_project_member.create_by is '创建者';
comment on column anno_project_member.create_time is '创建时间';

create table anno_project_schema (
    schema_id bigserial not null,
    project_id bigint not null,
    version_no int4 not null,
    schema_json jsonb not null,
    is_active char(1) default '1',
    create_by varchar(64) default '',
    create_time timestamp(0),
    primary key (schema_id)
);
create unique index uk_anno_schema_proj_ver on anno_project_schema(project_id, version_no);
create index idx_anno_schema_active on anno_project_schema(project_id, is_active);
comment on table anno_project_schema is '项目标签体系版本表';
comment on column anno_project_schema.schema_id is '版本ID';
comment on column anno_project_schema.project_id is '项目ID';
comment on column anno_project_schema.version_no is '版本号';
comment on column anno_project_schema.schema_json is '标签体系定义JSON';
comment on column anno_project_schema.is_active is '是否当前生效版本（0否 1是）';
comment on column anno_project_schema.create_by is '创建者';
comment on column anno_project_schema.create_time is '创建时间';

create table anno_dataset (
    dataset_id bigserial not null,
    project_id bigint not null,
    dataset_name varchar(128) not null,
    source_type varchar(32) default 'upload',
    total_count int4 default 0,
    dataset_status char(1) default '0',
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    primary key (dataset_id)
);
create index idx_anno_dataset_proj on anno_dataset(project_id, dataset_status);
comment on table anno_dataset is '数据集表';
comment on column anno_dataset.dataset_id is '数据集ID';
comment on column anno_dataset.project_id is '项目ID';
comment on column anno_dataset.dataset_name is '数据集名称';
comment on column anno_dataset.source_type is '数据来源类型';
comment on column anno_dataset.total_count is '数据总量';
comment on column anno_dataset.dataset_status is '数据集状态（0处理中 1可用 2失败）';
comment on column anno_dataset.create_by is '创建者';
comment on column anno_dataset.create_time is '创建时间';
comment on column anno_dataset.update_by is '更新者';
comment on column anno_dataset.update_time is '更新时间';

create table anno_dataset_item (
    item_id bigserial not null,
    dataset_id bigint not null,
    project_id bigint not null,
    file_uri text not null,
    file_name varchar(255),
    width int4,
    height int4,
    sha256 char(64),
    meta_json jsonb,
    create_time timestamp(0),
    primary key (item_id)
);
create index idx_anno_item_dataset on anno_dataset_item(dataset_id);
create index idx_anno_item_project on anno_dataset_item(project_id);
create index idx_anno_item_sha256 on anno_dataset_item(project_id, sha256);
comment on table anno_dataset_item is '数据集明细表';
comment on column anno_dataset_item.item_id is '数据项ID';
comment on column anno_dataset_item.dataset_id is '数据集ID';
comment on column anno_dataset_item.project_id is '项目ID';
comment on column anno_dataset_item.file_uri is '文件存储地址';
comment on column anno_dataset_item.file_name is '文件名称';
comment on column anno_dataset_item.width is '图像宽度';
comment on column anno_dataset_item.height is '图像高度';
comment on column anno_dataset_item.sha256 is '文件哈希';
comment on column anno_dataset_item.meta_json is '扩展元数据JSON';
comment on column anno_dataset_item.create_time is '创建时间';

create table anno_task (
    task_id bigserial not null,
    project_id bigint not null,
    task_name varchar(128) not null,
    priority varchar(16) default 'medium',
    task_status char(1) default '0',
    assignee_id bigint,
    review_mode varchar(32) default 'double_review',
    due_time timestamp(0),
    create_by varchar(64) default '',
    create_time timestamp(0),
    update_by varchar(64) default '',
    update_time timestamp(0),
    remark varchar(500) default null,
    primary key (task_id)
);
create index idx_anno_task_proj_status on anno_task(project_id, task_status);
create index idx_anno_task_assignee on anno_task(assignee_id, task_status);
comment on table anno_task is '标注任务表';
comment on column anno_task.task_id is '任务ID';
comment on column anno_task.project_id is '项目ID';
comment on column anno_task.task_name is '任务名称';
comment on column anno_task.priority is '优先级（high/medium/low）';
comment on column anno_task.task_status is '任务状态（0待开始 1进行中 2待质检 3已完成 4关闭）';
comment on column anno_task.assignee_id is '任务执行人用户ID';
comment on column anno_task.review_mode is '复审模式';
comment on column anno_task.due_time is '任务截止时间';
comment on column anno_task.create_by is '创建者';
comment on column anno_task.create_time is '创建时间';
comment on column anno_task.update_by is '更新者';
comment on column anno_task.update_time is '更新时间';
comment on column anno_task.remark is '备注';

create table anno_task_config (
    task_id bigint not null,
    autosave_interval_sec int4 default 15,
    review_required char(1) default '1',
    max_objects_per_image int4 default 50,
    quality_threshold numeric(5,4) default 0.8000,
    allow_skip char(1) default '1',
    update_by varchar(64) default '',
    update_time timestamp(0),
    primary key (task_id)
);
comment on table anno_task_config is '任务配置表';
comment on column anno_task_config.task_id is '任务ID';
comment on column anno_task_config.autosave_interval_sec is '自动保存间隔（秒）';
comment on column anno_task_config.review_required is '是否强制质检（0否 1是）';
comment on column anno_task_config.max_objects_per_image is '单图最大标注目标数';
comment on column anno_task_config.quality_threshold is '质量阈值';
comment on column anno_task_config.allow_skip is '是否允许跳过（0否 1是）';
comment on column anno_task_config.update_by is '更新者';
comment on column anno_task_config.update_time is '更新时间';

create table anno_task_item (
    task_item_id bigserial not null,
    task_id bigint not null,
    item_id bigint not null,
    task_item_status char(1) default '0',
    assignee_id bigint,
    claimed_at timestamp(0),
    finished_at timestamp(0),
    lock_token varchar(64),
    lock_expire_at timestamp(0),
    version int4 default 0,
    primary key (task_item_id)
);
create unique index uk_anno_task_item on anno_task_item(task_id, item_id);
create index idx_anno_task_item_status on anno_task_item(task_id, task_item_status);
create index idx_anno_task_item_lock on anno_task_item(lock_expire_at);
comment on table anno_task_item is '任务数据分配表';
comment on column anno_task_item.task_item_id is '任务数据分配ID';
comment on column anno_task_item.task_id is '任务ID';
comment on column anno_task_item.item_id is '数据项ID';
comment on column anno_task_item.task_item_status is '分配状态（0待领取 1标注中 2待质检 3返工中 4完成）';
comment on column anno_task_item.assignee_id is '当前执行人用户ID';
comment on column anno_task_item.claimed_at is '领取时间';
comment on column anno_task_item.finished_at is '完成时间';
comment on column anno_task_item.lock_token is '并发锁令牌';
comment on column anno_task_item.lock_expire_at is '锁过期时间';
comment on column anno_task_item.version is '乐观锁版本号';

create table anno_label_class (
    label_id bigserial not null,
    project_id bigint not null,
    schema_version int4 not null,
    label_code varchar(64) not null,
    label_name varchar(64) not null,
    color varchar(16),
    sort_order int4 default 0,
    status char(1) default '0',
    primary key (label_id)
);
create unique index uk_anno_label_code on anno_label_class(project_id, schema_version, label_code);
comment on table anno_label_class is '标签类目表';
comment on column anno_label_class.label_id is '标签ID';
comment on column anno_label_class.project_id is '项目ID';
comment on column anno_label_class.schema_version is '标签体系版本号';
comment on column anno_label_class.label_code is '标签编码';
comment on column anno_label_class.label_name is '标签名称';
comment on column anno_label_class.color is '标签颜色';
comment on column anno_label_class.sort_order is '显示顺序';
comment on column anno_label_class.status is '状态（0启用 1停用）';

create table anno_label_attr_def (
    attr_def_id bigserial not null,
    label_id bigint not null,
    attr_key varchar(64) not null,
    attr_name varchar(64) not null,
    value_type varchar(16) not null,
    required_flag char(1) default '0',
    constraints_json jsonb,
    primary key (attr_def_id)
);
create unique index uk_anno_attr_key on anno_label_attr_def(label_id, attr_key);
comment on table anno_label_attr_def is '标签属性定义表';
comment on column anno_label_attr_def.attr_def_id is '属性定义ID';
comment on column anno_label_attr_def.label_id is '标签ID';
comment on column anno_label_attr_def.attr_key is '属性键';
comment on column anno_label_attr_def.attr_name is '属性名称';
comment on column anno_label_attr_def.value_type is '值类型（string/number/boolean/enum）';
comment on column anno_label_attr_def.required_flag is '是否必填（0否 1是）';
comment on column anno_label_attr_def.constraints_json is '属性约束JSON';

create table anno_label_attr_option (
    option_id bigserial not null,
    attr_def_id bigint not null,
    option_value varchar(128) not null,
    option_label varchar(128) not null,
    sort_order int4 default 0,
    is_default char(1) default '0',
    primary key (option_id)
);
create index idx_anno_option_attr on anno_label_attr_option(attr_def_id);
comment on table anno_label_attr_option is '标签属性枚举选项表';
comment on column anno_label_attr_option.option_id is '选项ID';
comment on column anno_label_attr_option.attr_def_id is '属性定义ID';
comment on column anno_label_attr_option.option_value is '选项值';
comment on column anno_label_attr_option.option_label is '选项显示名';
comment on column anno_label_attr_option.sort_order is '显示顺序';
comment on column anno_label_attr_option.is_default is '是否默认（0否 1是）';

create table anno_annotation (
    annotation_id bigserial not null,
    task_item_id bigint not null,
    project_id bigint not null,
    task_id bigint not null,
    item_id bigint not null,
    current_revision_no int4 default 0,
    annotation_status char(1) default '0',
    result_json jsonb not null,
    schema_version int4,
    annotator_id bigint,
    submitted_at timestamp(0),
    version int4 default 0,
    create_time timestamp(0),
    update_time timestamp(0),
    primary key (annotation_id)
);
create unique index uk_anno_annotation_task_item on anno_annotation(task_item_id);
create index idx_anno_annotation_task on anno_annotation(project_id, task_id);
create index idx_anno_annotation_item on anno_annotation(item_id);
comment on table anno_annotation is '标注结果快照表';
comment on column anno_annotation.annotation_id is '标注结果ID';
comment on column anno_annotation.task_item_id is '任务数据分配ID';
comment on column anno_annotation.project_id is '项目ID';
comment on column anno_annotation.task_id is '任务ID';
comment on column anno_annotation.item_id is '数据项ID';
comment on column anno_annotation.current_revision_no is '当前版本号';
comment on column anno_annotation.annotation_status is '标注状态（0草稿 1已提交 2质检退回 3通过）';
comment on column anno_annotation.result_json is '当前标注结果JSON';
comment on column anno_annotation.schema_version is '标签体系版本号';
comment on column anno_annotation.annotator_id is '标注人用户ID';
comment on column anno_annotation.submitted_at is '提交时间';
comment on column anno_annotation.version is '乐观锁版本号';
comment on column anno_annotation.create_time is '创建时间';
comment on column anno_annotation.update_time is '更新时间';

create table anno_annotation_revision (
    revision_id bigserial not null,
    annotation_id bigint not null,
    revision_no int4 not null,
    operation_type varchar(16) not null,
    result_json jsonb not null,
    changed_by bigint,
    change_reason varchar(256),
    create_time timestamp(0),
    primary key (revision_id)
);
create unique index uk_anno_revision_no on anno_annotation_revision(annotation_id, revision_no);
create index idx_anno_revision_ct on anno_annotation_revision(create_time);
comment on table anno_annotation_revision is '标注结果历史版本表';
comment on column anno_annotation_revision.revision_id is '历史版本ID';
comment on column anno_annotation_revision.annotation_id is '标注结果ID';
comment on column anno_annotation_revision.revision_no is '版本号';
comment on column anno_annotation_revision.operation_type is '操作类型（create/save/submit/rework）';
comment on column anno_annotation_revision.result_json is '版本标注结果JSON';
comment on column anno_annotation_revision.changed_by is '变更人用户ID';
comment on column anno_annotation_revision.change_reason is '变更原因';
comment on column anno_annotation_revision.create_time is '创建时间';

create table anno_qc_task (
    qc_task_id bigserial not null,
    project_id bigint not null,
    source_task_id bigint not null,
    sample_strategy varchar(32) default 'full',
    sample_rate numeric(5,2) default 100.00,
    qc_status char(1) default '0',
    reviewer_id bigint,
    create_time timestamp(0),
    update_time timestamp(0),
    primary key (qc_task_id)
);
create index idx_anno_qc_task_proj on anno_qc_task(project_id, qc_status);
comment on table anno_qc_task is '质检任务表';
comment on column anno_qc_task.qc_task_id is '质检任务ID';
comment on column anno_qc_task.project_id is '项目ID';
comment on column anno_qc_task.source_task_id is '来源标注任务ID';
comment on column anno_qc_task.sample_strategy is '抽样策略';
comment on column anno_qc_task.sample_rate is '抽样比例';
comment on column anno_qc_task.qc_status is '质检任务状态（0待开始 1进行中 2完成）';
comment on column anno_qc_task.reviewer_id is '质检负责人用户ID';
comment on column anno_qc_task.create_time is '创建时间';
comment on column anno_qc_task.update_time is '更新时间';

create table anno_qc_item (
    qc_item_id bigserial not null,
    qc_task_id bigint not null,
    annotation_id bigint not null,
    qc_item_status char(1) default '0',
    claimed_by bigint,
    claimed_at timestamp(0),
    primary key (qc_item_id)
);
create unique index uk_anno_qc_item on anno_qc_item(qc_task_id, annotation_id);
comment on table anno_qc_item is '质检明细表';
comment on column anno_qc_item.qc_item_id is '质检明细ID';
comment on column anno_qc_item.qc_task_id is '质检任务ID';
comment on column anno_qc_item.annotation_id is '标注结果ID';
comment on column anno_qc_item.qc_item_status is '质检状态（0待检 1质检中 2已完成）';
comment on column anno_qc_item.claimed_by is '质检领取人用户ID';
comment on column anno_qc_item.claimed_at is '领取时间';

create table anno_qc_result (
    qc_result_id bigserial not null,
    qc_item_id bigint not null,
    decision varchar(16) not null,
    score numeric(5,2),
    issue_codes text,
    comment text,
    reviewed_by bigint,
    reviewed_at timestamp(0),
    primary key (qc_result_id)
);
create index idx_anno_qcr_decision on anno_qc_result(decision, reviewed_at);
comment on table anno_qc_result is '质检结果表';
comment on column anno_qc_result.qc_result_id is '质检结果ID';
comment on column anno_qc_result.qc_item_id is '质检明细ID';
comment on column anno_qc_result.decision is '质检结论（pass/reject/rework）';
comment on column anno_qc_result.score is '质量评分';
comment on column anno_qc_result.issue_codes is '问题编码集合';
comment on column anno_qc_result.comment is '质检说明';
comment on column anno_qc_result.reviewed_by is '质检人用户ID';
comment on column anno_qc_result.reviewed_at is '质检时间';

create table anno_rework_ticket (
    rework_id bigserial not null,
    annotation_id bigint not null,
    from_qc_result_id bigint not null,
    rework_status char(1) default '0',
    assigned_to bigint,
    due_time timestamp(0),
    closed_at timestamp(0),
    primary key (rework_id)
);
create index idx_anno_rework_status on anno_rework_ticket(rework_status, due_time);
comment on table anno_rework_ticket is '返工工单表';
comment on column anno_rework_ticket.rework_id is '返工单ID';
comment on column anno_rework_ticket.annotation_id is '标注结果ID';
comment on column anno_rework_ticket.from_qc_result_id is '来源质检结果ID';
comment on column anno_rework_ticket.rework_status is '返工状态（0待处理 1处理中 2已关闭）';
comment on column anno_rework_ticket.assigned_to is '返工处理人用户ID';
comment on column anno_rework_ticket.due_time is '返工截止时间';
comment on column anno_rework_ticket.closed_at is '关闭时间';

create table anno_import_job (
    import_job_id bigserial not null,
    project_id bigint not null,
    dataset_id bigint,
    import_status char(1) default '0',
    total_items int4 default 0,
    success_items int4 default 0,
    failed_items int4 default 0,
    error_report_uri text,
    started_at timestamp(0),
    finished_at timestamp(0),
    create_by varchar(64) default '',
    create_time timestamp(0),
    primary key (import_job_id)
);
create index idx_anno_import_proj on anno_import_job(project_id, import_status, started_at);
comment on table anno_import_job is '导入任务表';
comment on column anno_import_job.import_job_id is '导入任务ID';
comment on column anno_import_job.project_id is '项目ID';
comment on column anno_import_job.dataset_id is '数据集ID';
comment on column anno_import_job.import_status is '导入状态（0处理中 1成功 2失败）';
comment on column anno_import_job.total_items is '总条数';
comment on column anno_import_job.success_items is '成功条数';
comment on column anno_import_job.failed_items is '失败条数';
comment on column anno_import_job.error_report_uri is '错误报告地址';
comment on column anno_import_job.started_at is '开始时间';
comment on column anno_import_job.finished_at is '结束时间';
comment on column anno_import_job.create_by is '创建者';
comment on column anno_import_job.create_time is '创建时间';

create table anno_export_job (
    export_job_id bigserial not null,
    project_id bigint not null,
    task_id bigint,
    export_format varchar(16) not null,
    export_status char(1) default '0',
    version_strategy varchar(32) default 'latest',
    file_uri text,
    file_checksum varchar(128),
    started_at timestamp(0),
    finished_at timestamp(0),
    requested_by bigint,
    primary key (export_job_id)
);
create index idx_anno_export_proj on anno_export_job(project_id, export_status, started_at);
comment on table anno_export_job is '导出任务表';
comment on column anno_export_job.export_job_id is '导出任务ID';
comment on column anno_export_job.project_id is '项目ID';
comment on column anno_export_job.task_id is '任务ID';
comment on column anno_export_job.export_format is '导出格式（COCO/VOC/YOLO/JSON）';
comment on column anno_export_job.export_status is '导出状态（0处理中 1成功 2失败）';
comment on column anno_export_job.version_strategy is '版本策略';
comment on column anno_export_job.file_uri is '导出文件地址';
comment on column anno_export_job.file_checksum is '文件校验码';
comment on column anno_export_job.started_at is '开始时间';
comment on column anno_export_job.finished_at is '结束时间';
comment on column anno_export_job.requested_by is '发起人用户ID';

create table anno_export_item (
    export_item_id bigserial not null,
    export_job_id bigint not null,
    item_id bigint not null,
    annotation_revision_id bigint,
    item_status char(1) default '0',
    error_msg varchar(500),
    primary key (export_item_id)
);
create index idx_anno_export_item_job on anno_export_item(export_job_id);
comment on table anno_export_item is '导出明细表';
comment on column anno_export_item.export_item_id is '导出明细ID';
comment on column anno_export_item.export_job_id is '导出任务ID';
comment on column anno_export_item.item_id is '数据项ID';
comment on column anno_export_item.annotation_revision_id is '导出版本ID';
comment on column anno_export_item.item_status is '导出明细状态（0成功 1失败）';
comment on column anno_export_item.error_msg is '失败原因';

create table anno_audit_log (
    audit_id bigserial not null,
    actor_id bigint,
    module varchar(64) not null,
    action varchar(64) not null,
    target_type varchar(64),
    target_id bigint,
    before_data jsonb,
    after_data jsonb,
    ipaddr varchar(128),
    create_time timestamp(0),
    primary key (audit_id)
);
create index idx_anno_audit_module_time on anno_audit_log(module, create_time);
create index idx_anno_audit_target on anno_audit_log(target_type, target_id);
comment on table anno_audit_log is '标注业务审计日志表';
comment on column anno_audit_log.audit_id is '审计日志ID';
comment on column anno_audit_log.actor_id is '操作人用户ID';
comment on column anno_audit_log.module is '业务模块';
comment on column anno_audit_log.action is '操作动作';
comment on column anno_audit_log.target_type is '目标类型';
comment on column anno_audit_log.target_id is '目标ID';
comment on column anno_audit_log.before_data is '变更前数据JSON';
comment on column anno_audit_log.after_data is '变更后数据JSON';
comment on column anno_audit_log.ipaddr is '操作IP';
comment on column anno_audit_log.create_time is '操作时间';

alter table anno_project
    add constraint fk_anno_project_owner foreign key (owner_id) references sys_user (user_id);
alter table anno_project_member
    add constraint fk_anno_pm_project foreign key (project_id) references anno_project (project_id);
alter table anno_project_member
    add constraint fk_anno_pm_user foreign key (user_id) references sys_user (user_id);
alter table anno_project_schema
    add constraint fk_anno_schema_project foreign key (project_id) references anno_project (project_id);
alter table anno_dataset
    add constraint fk_anno_dataset_project foreign key (project_id) references anno_project (project_id);
alter table anno_dataset_item
    add constraint fk_anno_item_dataset foreign key (dataset_id) references anno_dataset (dataset_id);
alter table anno_dataset_item
    add constraint fk_anno_item_project foreign key (project_id) references anno_project (project_id);
alter table anno_task
    add constraint fk_anno_task_project foreign key (project_id) references anno_project (project_id);
alter table anno_task
    add constraint fk_anno_task_assignee foreign key (assignee_id) references sys_user (user_id);
alter table anno_task_config
    add constraint fk_anno_task_config_task foreign key (task_id) references anno_task (task_id);
alter table anno_task_item
    add constraint fk_anno_task_item_task foreign key (task_id) references anno_task (task_id);
alter table anno_task_item
    add constraint fk_anno_task_item_item foreign key (item_id) references anno_dataset_item (item_id);
alter table anno_task_item
    add constraint fk_anno_task_item_assignee foreign key (assignee_id) references sys_user (user_id);
alter table anno_label_class
    add constraint fk_anno_label_project foreign key (project_id) references anno_project (project_id);
alter table anno_label_attr_def
    add constraint fk_anno_attr_label foreign key (label_id) references anno_label_class (label_id);
alter table anno_label_attr_option
    add constraint fk_anno_option_attr foreign key (attr_def_id) references anno_label_attr_def (attr_def_id);
alter table anno_annotation
    add constraint fk_anno_ann_task_item foreign key (task_item_id) references anno_task_item (task_item_id);
alter table anno_annotation
    add constraint fk_anno_ann_project foreign key (project_id) references anno_project (project_id);
alter table anno_annotation
    add constraint fk_anno_ann_task foreign key (task_id) references anno_task (task_id);
alter table anno_annotation
    add constraint fk_anno_ann_item foreign key (item_id) references anno_dataset_item (item_id);
alter table anno_annotation
    add constraint fk_anno_ann_user foreign key (annotator_id) references sys_user (user_id);
alter table anno_annotation_revision
    add constraint fk_anno_revision_ann foreign key (annotation_id) references anno_annotation (annotation_id);
alter table anno_annotation_revision
    add constraint fk_anno_revision_user foreign key (changed_by) references sys_user (user_id);
alter table anno_qc_task
    add constraint fk_anno_qct_project foreign key (project_id) references anno_project (project_id);
alter table anno_qc_task
    add constraint fk_anno_qct_task foreign key (source_task_id) references anno_task (task_id);
alter table anno_qc_task
    add constraint fk_anno_qct_reviewer foreign key (reviewer_id) references sys_user (user_id);
alter table anno_qc_item
    add constraint fk_anno_qci_task foreign key (qc_task_id) references anno_qc_task (qc_task_id);
alter table anno_qc_item
    add constraint fk_anno_qci_ann foreign key (annotation_id) references anno_annotation (annotation_id);
alter table anno_qc_item
    add constraint fk_anno_qci_user foreign key (claimed_by) references sys_user (user_id);
alter table anno_qc_result
    add constraint fk_anno_qcr_item foreign key (qc_item_id) references anno_qc_item (qc_item_id);
alter table anno_qc_result
    add constraint fk_anno_qcr_user foreign key (reviewed_by) references sys_user (user_id);
alter table anno_rework_ticket
    add constraint fk_anno_rework_ann foreign key (annotation_id) references anno_annotation (annotation_id);
alter table anno_rework_ticket
    add constraint fk_anno_rework_qc foreign key (from_qc_result_id) references anno_qc_result (qc_result_id);
alter table anno_rework_ticket
    add constraint fk_anno_rework_user foreign key (assigned_to) references sys_user (user_id);
alter table anno_import_job
    add constraint fk_anno_import_project foreign key (project_id) references anno_project (project_id);
alter table anno_import_job
    add constraint fk_anno_import_dataset foreign key (dataset_id) references anno_dataset (dataset_id);
alter table anno_export_job
    add constraint fk_anno_export_project foreign key (project_id) references anno_project (project_id);
alter table anno_export_job
    add constraint fk_anno_export_task foreign key (task_id) references anno_task (task_id);
alter table anno_export_job
    add constraint fk_anno_export_user foreign key (requested_by) references sys_user (user_id);
alter table anno_export_item
    add constraint fk_anno_exp_item_job foreign key (export_job_id) references anno_export_job (export_job_id);
alter table anno_export_item
    add constraint fk_anno_exp_item_data foreign key (item_id) references anno_dataset_item (item_id);
alter table anno_export_item
    add constraint fk_anno_exp_item_rev foreign key (annotation_revision_id) references anno_annotation_revision (revision_id);
alter table anno_audit_log
    add constraint fk_anno_audit_user foreign key (actor_id) references sys_user (user_id);

CREATE OR REPLACE FUNCTION "find_in_set"(int8, varchar)
    RETURNS "pg_catalog"."bool" AS $BODY$
DECLARE
    STR ALIAS FOR $1;
    STRS ALIAS FOR $2;
    POS INTEGER;
    STATUS BOOLEAN;
BEGIN
    SELECT POSITION( ','||STR||',' IN ','||STRS||',') INTO POS;
    IF POS > 0 THEN
        STATUS = TRUE;
    ELSE
        STATUS = FALSE;
    END IF;
    RETURN STATUS;
END;
$BODY$
    LANGUAGE plpgsql VOLATILE
                     COST 100;

create or replace view list_column as
SELECT c.relname                                                                           AS table_name,
       a.attname                                                                           AS column_name,
       d.description                                                                       AS column_comment,
       CASE
           WHEN a.attnotnull AND con.conname IS NULL THEN '1'
           ELSE '0'
           END                                                                             AS is_required,
       CASE
           WHEN con.conname IS NOT NULL THEN '1'
           ELSE '0'
           END                                                                             AS is_pk,
       a.attnum                                                                            AS sort,
       CASE
           WHEN "position"(pg_get_expr(ad.adbin, ad.adrelid), ((c.relname::text || '_'::text) || a.attname
                           ::text) || '_seq'::text) > 0 THEN '1'
           ELSE '0'
           END                                                                             AS is_increment,
       btrim(
                   CASE
                       WHEN t.typelem <> 0::oid AND t.typlen = '-1'::integer THEN 'ARRAY'::text
            ELSE
            CASE
                WHEN t.typtype = 'd'::"char" THEN format_type(t.typbasetype, NULL::integer)
                ELSE format_type(a.atttypid, NULL::integer)
            END
        END, '"'::text) AS column_type
FROM pg_attribute a
         JOIN (pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid) ON a.attrelid = c.oid
         LEFT JOIN pg_description d ON d.objoid = c.oid AND a.attnum = d.objsubid
         LEFT JOIN pg_constraint con ON con.conrelid = c.oid AND (a.attnum = ANY (con.conkey))
         LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
         LEFT JOIN pg_type t ON a.atttypid = t.oid
WHERE (c.relkind = ANY (ARRAY['r'::"char", 'p'::"char"]))
  AND a.attnum > 0
  AND n.nspname = 'public'::name
  AND not a.attisdropped
  ORDER BY c.relname, a.attnum;

create or replace view list_table as
SELECT c.relname              AS table_name,
       obj_description(c.oid) AS table_comment,
       CURRENT_TIMESTAMP      AS create_time,
       CURRENT_TIMESTAMP      AS update_time
FROM pg_class c
         LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (c.relkind = ANY (ARRAY['r'::"char", 'p'::"char"]))
  AND c.relname !~~ 'spatial_%'::text AND n.nspname = 'public'::name AND n.nspname <> ''::name;

CREATE OR REPLACE FUNCTION substring_index(varchar, varchar, integer)
RETURNS varchar AS $$
DECLARE
tokens varchar[];
length integer ;
indexnum integer;
BEGIN
tokens := pg_catalog.string_to_array($1, $2);
length := pg_catalog.array_upper(tokens, 1);
indexnum := length - ($3 * -1) + 1;
IF $3 >= 0 THEN
RETURN pg_catalog.array_to_string(tokens[1:$3], $2);
ELSE
RETURN pg_catalog.array_to_string(tokens[indexnum:length], $2);
END IF;
END;
$$ IMMUTABLE STRICT LANGUAGE PLPGSQL;
