CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
        CREATE TYPE report_status AS ENUM ('pending', 'resolved', 'dismissed');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friendship_status') THEN
        CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE member_status AS ENUM ('active', 'muted');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE member_role AS ENUM ('member', 'moderator', 'owner');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    avatar_url TEXT,
    owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    search_vector tsvector,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    rule_title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status member_status DEFAULT 'active',
    role member_role DEFAULT 'member',
    can_delete_posts BOOLEAN DEFAULT false,
    can_ban_users BOOLEAN DEFAULT false,
    can_manage_mods BOOLEAN DEFAULT false,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id, user_id)
);

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    post TEXT,
    main_image_url TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    upvotes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    search_vector tsvector,
    is_spoiler BOOLEAN DEFAULT false,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    upvotes_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    value SMALLINT CHECK (value IN (-1, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id_1 UUID REFERENCES users(id) ON DELETE CASCADE,
    user_id_2 UUID REFERENCES users(id) ON DELETE CASCADE,
    status friendship_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (user_id_1 != user_id_2),
    UNIQUE(user_id_1, user_id_2)
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS community_tags (
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (community_id, tag_id)
);

CREATE TABLE IF NOT EXISTS post_tags (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT,
    search_vector tsvector,
    is_edited BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    updated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    type TEXT,
    url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES rules(id) ON DELETE SET NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    status report_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users_banned (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    banned_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS users_search_idx ON users USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS communities_search_idx ON communities USING GIN (search_vector);


CREATE OR REPLACE FUNCTION posts_fts_func() RETURNS trigger AS $$
BEGIN
    NEW.search_vector := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A') || 
                         setweight(to_tsvector('simple', coalesce(NEW.post,'')), 'B');
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_posts_search BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION posts_fts_func();

CREATE OR REPLACE FUNCTION general_fts_func() RETURNS trigger AS $$
BEGIN
    IF TG_TABLE_NAME = 'users' THEN
        NEW.search_vector := setweight(to_tsvector('simple', coalesce(NEW.username,'')), 'A') || 
                             setweight(to_tsvector('simple', coalesce(NEW.bio,'')), 'B');
    ELSIF TG_TABLE_NAME = 'communities' THEN
        NEW.search_vector := setweight(to_tsvector('simple', coalesce(NEW.name,'')), 'A') || 
                             setweight(to_tsvector('simple', coalesce(NEW.description,'')), 'B');
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_search BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION general_fts_func();

CREATE TRIGGER trg_comm_search BEFORE INSERT OR UPDATE ON communities
FOR EACH ROW EXECUTE FUNCTION general_fts_func();

CREATE OR REPLACE FUNCTION check_email_func() RETURNS trigger AS $$
BEGIN
    IF NEW.email !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' THEN
        RAISE EXCEPTION 'Niepoprawny format email: %', NEW.email;
    END IF;
    RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_email BEFORE INSERT OR UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION check_email_func();