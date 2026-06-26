// 活动卡列表共享的查询配置（发现页/分类页/专栏页一致）
export const LIVE_STATUS = ['PUBLISHED', 'FULL', 'ONGOING', 'ENDED'];

// 列表卡 include：场馆 + 前 5 个报名头像 + 报名数
export const EVENT_CARD_INCLUDE: any = {
  venue: { select: { id: true, name: true, city: true } },
  signups: {
    where: { status: 'CONFIRMED' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { user: { select: { id: true, avatarUrl: true } } },
  },
  _count: { select: { signups: { where: { status: 'CONFIRMED' } } } },
};
