const STORAGE_KEY = "workhub:postReplies";

export interface ReplyLinkInfo {
    url: string;
    description: string;
}

export interface ReplyAttachmentInfo {
    name: string;
    size?: number;
    dataUrl?: string;
}

export interface PostReplyItem {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    author: string;
    attachments: ReplyAttachmentInfo[];
    links: ReplyLinkInfo[];
    updatedAt?: string;
}

export type ReplyMap = Record<string, PostReplyItem[]>;

const isBrowser = typeof window !== "undefined";

const readReplyMap = (): ReplyMap => {
    if (!isBrowser) return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return typeof parsed === "object" && parsed ? parsed : {};
    } catch {
        return {};
    }
};

export const POST_REPLIES_UPDATED_EVENT = "workhub:postRepliesUpdated";

const notifyRepliesUpdated = () => {
    if (!isBrowser || typeof window.dispatchEvent !== "function") return;
    window.dispatchEvent(new CustomEvent(POST_REPLIES_UPDATED_EVENT));
};

const writeReplyMap = (map: ReplyMap) => {
    if (!isBrowser) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        notifyRepliesUpdated();
    } catch {
        // ignore
    }
};

export const loadRepliesForPost = (postId: string): PostReplyItem[] => {
    const map = readReplyMap();
    return map[postId] ?? [];
};

export const saveRepliesForPost = (postId: string, replies: PostReplyItem[]) => {
    const map = readReplyMap();
    map[postId] = replies;
    writeReplyMap(map);
};

export const loadRepliesMap = (): ReplyMap => readReplyMap();
