import { useState } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

interface Section { h: string; p: string }
interface Doc { title: string; date: string; intro: string; sections: Section[] }

const PRIVACY: Doc = {
  title: '隐私政策',
  date: '更新日期：2026年6月27日',
  intro: '敞开酒馆小程序非常重视你的个人信息与隐私保护。本政策说明我们如何收集、使用、存储与保护你的个人信息，请你在使用前仔细阅读。',
  sections: [
    { h: '一、我们收集的信息', p: '为向你提供活动报名服务，我们会在你授权后收集：\n· 手机号：登录时经你授权提供，用于身份识别、活动报名与到场联系；\n· 头像与昵称：你在完善资料时主动填写，用于个人主页展示；\n· 其他资料：城市、简介、标签等你主动填写的内容。\n未经你授权，我们不会收集上述信息。' },
    { h: '二、信息的使用', p: '我们仅将收集的信息用于：\n· 活动的报名、签到与到场联系；\n· 会员、优惠券、订单等功能的提供；\n· 服务体验优化与必要的客户支持。' },
    { h: '三、第三方服务', p: '为实现登录、支付等功能，本小程序使用了微信提供的开放能力：\n· 微信登录：获取你的微信用户标识（OpenID），用于账号识别；\n· 手机号快速验证：经你授权获取手机号，用于注册登录与到场联系；\n· 微信支付：用于会员及付费活动的支付，相关支付信息由微信支付处理；\n· 订阅消息：经你授权后向你发送活动开始提醒。\n上述能力由微信（腾讯）提供，其如何处理信息详见《微信隐私保护指引》。' },
    { h: '四、信息的存储与保护', p: '· 你的信息存储于中华人民共和国境内的服务器；\n· 保存期限不超过实现上述目的所必需的时间，法律法规另有规定的除外；\n· 我们采取加密传输等合理措施保护你的信息安全。' },
    { h: '五、信息的共享', p: '· 我们不会向任何第三方出售你的个人信息；\n· 除法律法规要求，或为完成活动报名所必需（如向活动主办方提供报名名单）外，不会对外共享。' },
    { h: '六、你的权利', p: '· 查询与更正：可在「我的—编辑资料」中查看、修改你的资料；\n· 删除与撤回：可联系我们删除你的信息或撤回相关授权；\n· 注销账号：可联系我们注销账号，注销后我们将删除或匿名化你的个人信息。' },
    { h: '七、未成年人保护', p: '本服务主要面向成年人。若你是未成年人，请在监护人的陪同与同意下使用本服务并提供个人信息；监护人如对未成年人信息有疑问，可通过下方方式与我们联系。' },
    { h: '八、联系我们', p: '如对本隐私政策有任何疑问、意见或投诉，可通过以下方式联系我们：\n邮箱：boke1003@126.com\n我们将在收到后尽快处理与回复。' },
  ],
}

const USER: Doc = {
  title: '用户协议',
  date: '更新日期：2026年6月27日',
  intro: '欢迎使用敞开酒馆小程序。请在使用前仔细阅读本协议。当你登录并使用本服务，即表示你已阅读并同意本协议的全部内容。',
  sections: [
    { h: '一、服务内容', p: '本小程序为「敞开酒馆」线下活动提供信息展示、活动报名、会员、优惠券与订单等服务。' },
    { h: '二、账号与登录', p: '· 你通过手机号授权登录，应保证所提供信息真实有效；\n· 你应妥善保管账号，经由你账号产生的行为由你本人负责。' },
    { h: '三、用户行为规范', p: '· 你应遵守法律法规，不得利用本服务从事违法或损害他人权益的行为；\n· 报名活动后请按约定到场，如需取消请提前操作。' },
    { h: '四、费用与退款', p: '· 付费活动及会员的价格、权益以页面展示为准；\n· 退款规则按活动说明及相关页面执行。' },
    { h: '五、免责声明', p: '· 因不可抗力或非我方原因导致的服务中断，我们不承担责任；\n· 活动具体内容由主办方负责，请以现场实际为准。' },
    { h: '六、协议的变更', p: '我们可能适时更新本协议，更新后将在小程序内公示，请你留意查看。' },
  ],
}

export default function Agreement() {
  const [doc, setDoc] = useState<Doc | null>(null)

  useLoad((opts: any) => {
    const d = opts?.type === 'user' ? USER : PRIVACY
    setDoc(d)
    Taro.setNavigationBarTitle({ title: d.title })
  })

  if (!doc) return null

  return (
    <ScrollView scrollY className='agr-page'>
      <Text className='agr-date'>{doc.date}</Text>
      <Text className='agr-intro'>{doc.intro}</Text>
      {doc.sections.map((s, i) => (
        <View key={i} className='agr-sec'>
          <Text className='agr-h'>{s.h}</Text>
          <Text className='agr-p'>{s.p}</Text>
        </View>
      ))}
      <View className='agr-bottom' />
    </ScrollView>
  )
}
