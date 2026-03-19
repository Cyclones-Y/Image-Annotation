from datetime import datetime

from sqlalchemy import JSON, CHAR, BigInteger, Column, DateTime, Index, Integer, Numeric, String, Text

from config.database import Base


class AnnoProject(Base):
    __tablename__ = 'anno_project'
    __table_args__ = {'comment': '标注项目表'}

    project_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='项目ID')
    project_code = Column(String(64), nullable=False, comment='项目编码')
    project_name = Column(String(128), nullable=False, comment='项目名称')
    owner_id = Column(BigInteger, nullable=False, comment='项目负责人用户ID')
    project_status = Column(CHAR(1), nullable=True, server_default='0', comment='项目状态')
    deadline = Column(DateTime, nullable=True, comment='项目截止时间')
    config_json = Column(JSON, nullable=True, comment='项目扩展配置JSON')
    del_flag = Column(CHAR(1), nullable=True, server_default='0', comment='删除标志')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
    update_by = Column(String(64), nullable=True, server_default="''", comment='更新者')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')
    remark = Column(String(500), nullable=True, comment='备注')


class AnnoProjectMember(Base):
    __tablename__ = 'anno_project_member'
    __table_args__ = {'comment': '项目成员权限表'}

    project_id = Column(BigInteger, primary_key=True, comment='项目ID')
    user_id = Column(BigInteger, primary_key=True, comment='用户ID')
    project_role = Column(String(32), nullable=False, comment='项目角色')
    can_annotate = Column(CHAR(1), nullable=True, server_default='0', comment='是否可标注')
    can_review = Column(CHAR(1), nullable=True, server_default='0', comment='是否可质检')
    can_export = Column(CHAR(1), nullable=True, server_default='0', comment='是否可导出')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')


class AnnoTask(Base):
    __tablename__ = 'anno_task'
    __table_args__ = {'comment': '标注任务表'}

    task_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='任务ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    task_name = Column(String(128), nullable=False, comment='任务名称')
    priority = Column(String(16), nullable=True, server_default='medium', comment='优先级')
    task_status = Column(CHAR(1), nullable=True, server_default='0', comment='任务状态')
    assignee_id = Column(BigInteger, nullable=True, comment='任务执行人用户ID')
    review_mode = Column(String(32), nullable=True, server_default='double_review', comment='复审模式')
    due_time = Column(DateTime, nullable=True, comment='任务截止时间')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
    update_by = Column(String(64), nullable=True, server_default="''", comment='更新者')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')
    remark = Column(String(500), nullable=True, comment='备注')


class AnnoTaskConfig(Base):
    __tablename__ = 'anno_task_config'
    __table_args__ = {'comment': '任务配置表'}

    task_id = Column(BigInteger, primary_key=True, comment='任务ID')
    autosave_interval_sec = Column(Integer, nullable=True, server_default='15', comment='自动保存间隔')
    review_required = Column(CHAR(1), nullable=True, server_default='1', comment='是否强制质检')
    max_objects_per_image = Column(Integer, nullable=True, server_default='50', comment='单图最大标注目标数')
    quality_threshold = Column(Numeric(5, 4), nullable=True, server_default='0.8000', comment='质量阈值')
    allow_skip = Column(CHAR(1), nullable=True, server_default='1', comment='是否允许跳过')
    update_by = Column(String(64), nullable=True, server_default="''", comment='更新者')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')


class AnnoTaskItem(Base):
    __tablename__ = 'anno_task_item'
    __table_args__ = {'comment': '任务数据分配表'}

    task_item_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='任务数据分配ID')
    task_id = Column(BigInteger, nullable=False, comment='任务ID')
    item_id = Column(BigInteger, nullable=False, comment='数据项ID')
    task_item_status = Column(CHAR(1), nullable=True, server_default='0', comment='分配状态')
    assignee_id = Column(BigInteger, nullable=True, comment='当前执行人用户ID')
    claimed_at = Column(DateTime, nullable=True, comment='领取时间')
    finished_at = Column(DateTime, nullable=True, comment='完成时间')
    lock_token = Column(String(64), nullable=True, comment='并发锁令牌')
    lock_expire_at = Column(DateTime, nullable=True, comment='锁过期时间')
    version = Column(Integer, nullable=True, server_default='0', comment='乐观锁版本号')


class AnnoAnnotation(Base):
    __tablename__ = 'anno_annotation'
    __table_args__ = {'comment': '标注结果快照表'}

    annotation_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='标注结果ID')
    task_item_id = Column(BigInteger, nullable=False, comment='任务数据分配ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    task_id = Column(BigInteger, nullable=False, comment='任务ID')
    item_id = Column(BigInteger, nullable=False, comment='数据项ID')
    current_revision_no = Column(Integer, nullable=True, server_default='0', comment='当前版本号')
    annotation_status = Column(CHAR(1), nullable=True, server_default='0', comment='标注状态')
    result_json = Column(JSON, nullable=False, comment='当前标注结果JSON')
    schema_version = Column(Integer, nullable=True, comment='标签体系版本号')
    annotator_id = Column(BigInteger, nullable=True, comment='标注人用户ID')
    submitted_at = Column(DateTime, nullable=True, comment='提交时间')
    version = Column(Integer, nullable=True, server_default='0', comment='乐观锁版本号')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')


class AnnoAnnotationRevision(Base):
    __tablename__ = 'anno_annotation_revision'
    __table_args__ = {'comment': '标注结果历史版本表'}

    revision_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='历史版本ID')
    annotation_id = Column(BigInteger, nullable=False, comment='标注结果ID')
    revision_no = Column(Integer, nullable=False, comment='版本号')
    operation_type = Column(String(16), nullable=False, comment='操作类型')
    result_json = Column(JSON, nullable=False, comment='版本标注结果JSON')
    changed_by = Column(BigInteger, nullable=True, comment='变更人用户ID')
    change_reason = Column(String(256), nullable=True, comment='变更原因')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')


class AnnoImportJob(Base):
    __tablename__ = 'anno_import_job'
    __table_args__ = {'comment': '导入任务表'}

    import_job_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='导入任务ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    dataset_id = Column(BigInteger, nullable=True, comment='数据集ID')
    import_status = Column(CHAR(1), nullable=True, server_default='0', comment='导入状态')
    total_items = Column(Integer, nullable=True, server_default='0', comment='总条数')
    success_items = Column(Integer, nullable=True, server_default='0', comment='成功条数')
    failed_items = Column(Integer, nullable=True, server_default='0', comment='失败条数')
    error_report_uri = Column(Text, nullable=True, comment='错误报告地址')
    started_at = Column(DateTime, nullable=True, default=datetime.now(), comment='开始时间')
    finished_at = Column(DateTime, nullable=True, comment='结束时间')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')


class AnnoExportJob(Base):
    __tablename__ = 'anno_export_job'
    __table_args__ = {'comment': '导出任务表'}

    export_job_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='导出任务ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    task_id = Column(BigInteger, nullable=True, comment='任务ID')
    export_format = Column(String(16), nullable=False, comment='导出格式')
    export_status = Column(CHAR(1), nullable=True, server_default='0', comment='导出状态')
    version_strategy = Column(String(32), nullable=True, server_default='latest', comment='版本策略')
    file_uri = Column(Text, nullable=True, comment='导出文件地址')
    file_checksum = Column(String(128), nullable=True, comment='文件校验码')
    started_at = Column(DateTime, nullable=True, default=datetime.now(), comment='开始时间')
    finished_at = Column(DateTime, nullable=True, comment='结束时间')
    requested_by = Column(BigInteger, nullable=True, comment='发起人用户ID')


class AnnoLabel(Base):
    __tablename__ = 'anno_label'
    __table_args__ = (
        Index('idx_anno_label_project_name', 'project_id', 'label_name'),
        Index('idx_anno_label_project_category', 'project_id', 'label_category'),
        Index('idx_anno_label_project_usage', 'project_id', 'usage_count'),
        {'comment': '标签主表'},
    )

    label_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='标签ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    label_name = Column(String(128), nullable=False, comment='标签名称')
    label_type = Column(String(32), nullable=True, server_default='object', comment='标签类型')
    label_category = Column(String(64), nullable=True, server_default='default', comment='标签分类')
    label_color = Column(String(16), nullable=True, server_default='#1677ff', comment='颜色')
    usage_count = Column(BigInteger, nullable=True, server_default='0', comment='使用频次')
    last_used_at = Column(DateTime, nullable=True, comment='最后使用时间')
    del_flag = Column(CHAR(1), nullable=True, server_default='0', comment='删除标志')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
    update_by = Column(String(64), nullable=True, server_default="''", comment='更新者')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')


class AnnoLabelTemplate(Base):
    __tablename__ = 'anno_label_template'
    __table_args__ = (
        Index('idx_anno_label_template_project_code', 'project_id', 'template_code'),
        Index('idx_anno_label_template_latest', 'project_id', 'is_latest'),
        {'comment': '标签模板表'},
    )

    template_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='模板ID')
    template_code = Column(String(64), nullable=False, comment='模板编码')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    template_name = Column(String(128), nullable=False, comment='模板名称')
    template_category = Column(String(64), nullable=True, server_default='default', comment='模板分类')
    template_version = Column(Integer, nullable=True, server_default='1', comment='模板版本')
    visibility = Column(String(16), nullable=True, server_default='project', comment='可见范围')
    is_latest = Column(CHAR(1), nullable=True, server_default='1', comment='是否最新版本')
    owner_id = Column(BigInteger, nullable=True, comment='创建人')
    description = Column(String(500), nullable=True, comment='模板说明')
    del_flag = Column(CHAR(1), nullable=True, server_default='0', comment='删除标志')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
    update_by = Column(String(64), nullable=True, server_default="''", comment='更新者')
    update_time = Column(DateTime, nullable=True, default=datetime.now(), comment='更新时间')


class AnnoLabelTemplateItem(Base):
    __tablename__ = 'anno_label_template_item'
    __table_args__ = (
        Index('idx_anno_label_template_item_template', 'template_id'),
        Index('idx_anno_label_template_item_label', 'label_id'),
        {'comment': '标签模板与标签关系表'},
    )

    template_item_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='关系ID')
    template_id = Column(BigInteger, nullable=False, comment='模板ID')
    label_id = Column(BigInteger, nullable=False, comment='标签ID')
    sort_no = Column(Integer, nullable=True, server_default='0', comment='排序')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')


class AnnoLabelMigration(Base):
    __tablename__ = 'anno_label_migration'
    __table_args__ = (
        Index('idx_anno_label_migration_project', 'project_id'),
        Index('idx_anno_label_migration_source_target', 'source_label_id', 'target_label_id'),
        {'comment': '标签迁移记录表'},
    )

    migration_id = Column(BigInteger, primary_key=True, autoincrement=True, comment='迁移ID')
    project_id = Column(BigInteger, nullable=False, comment='项目ID')
    source_label_id = Column(BigInteger, nullable=False, comment='源标签ID')
    target_label_id = Column(BigInteger, nullable=False, comment='目标标签ID')
    affected_annotations = Column(BigInteger, nullable=True, server_default='0', comment='影响标注数')
    migrate_reason = Column(String(256), nullable=True, comment='迁移原因')
    create_by = Column(String(64), nullable=True, server_default="''", comment='创建者')
    create_time = Column(DateTime, nullable=True, default=datetime.now(), comment='创建时间')
