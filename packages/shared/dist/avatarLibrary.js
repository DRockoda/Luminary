export const AVATAR_LIBRARY = [
    { id: "adv-01", name: "Alex", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4" },
    { id: "adv-02", name: "Blair", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Blair&backgroundColor=c0aede" },
    { id: "adv-03", name: "Casey", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Casey&backgroundColor=d1d4f9" },
    { id: "adv-04", name: "Dana", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Dana&backgroundColor=ffd5dc" },
    { id: "adv-05", name: "Ellis", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Ellis&backgroundColor=ffdfbf" },
    { id: "adv-06", name: "Finley", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Finley&backgroundColor=c1f4c5" },
    { id: "adv-07", name: "Gray", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Gray&backgroundColor=b6e3f4" },
    { id: "adv-08", name: "Harper", style: "adventurer", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Harper&backgroundColor=ffd5dc" },
    { id: "lor-01", name: "Iris", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Iris&backgroundColor=b6e3f4" },
    { id: "lor-02", name: "Jamie", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Jamie&backgroundColor=c0aede" },
    { id: "lor-03", name: "Kai", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Kai&backgroundColor=d1d4f9" },
    { id: "lor-04", name: "Lee", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Lee&backgroundColor=ffdfbf" },
    { id: "lor-05", name: "Morgan", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Morgan&backgroundColor=c1f4c5" },
    { id: "lor-06", name: "Noel", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Noel&backgroundColor=ffd5dc" },
    { id: "lor-07", name: "Payton", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Payton&backgroundColor=b6e3f4" },
    { id: "lor-08", name: "Quinn", style: "lorelei", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Quinn&backgroundColor=c0aede" },
    { id: "not-01", name: "Remy", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Remy&backgroundColor=b6e3f4" },
    { id: "not-02", name: "Sam", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Sam&backgroundColor=ffd5dc" },
    { id: "not-03", name: "Taylor", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Taylor&backgroundColor=d1d4f9" },
    { id: "not-04", name: "Uma", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Uma&backgroundColor=ffdfbf" },
    { id: "not-05", name: "Val", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Val&backgroundColor=c1f4c5" },
    { id: "not-06", name: "Wren", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Wren&backgroundColor=ffd5dc" },
    { id: "not-07", name: "Xen", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Xen&backgroundColor=c0aede" },
    { id: "not-08", name: "Yuki", style: "notionists", url: "https://api.dicebear.com/7.x/notionists/svg?seed=Yuki&backgroundColor=b6e3f4" },
];
export const AVATAR_LIBRARY_IDS = AVATAR_LIBRARY.map((a) => a.id);
export function isAvatarLibraryId(id) {
    return AVATAR_LIBRARY_IDS.includes(id);
}
export function getAvatarLibraryPublicUrl(id) {
    return AVATAR_LIBRARY.find((a) => a.id === id)?.url;
}
