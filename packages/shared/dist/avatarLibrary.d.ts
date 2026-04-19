export type AvatarLibraryItem = {
    id: string;
    name: string;
    style: "adventurer" | "lorelei" | "notionists";
    /** DiceBear URL — also saved as `public/avatars/{id}.svg` */
    url: string;
};
export declare const AVATAR_LIBRARY: AvatarLibraryItem[];
export declare const AVATAR_LIBRARY_IDS: string[];
export declare function isAvatarLibraryId(id: string): id is string;
export declare function getAvatarLibraryPublicUrl(id: string): string | undefined;
