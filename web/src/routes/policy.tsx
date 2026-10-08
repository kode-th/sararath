import { Link, createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { env } from 'virtual:env/client';

import { buttonVariants } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { SITE_URL } from '@/constants/site';
import { formatDate } from '@/utils/format';

const CONTACT_EMAIL = 'contact@fasu.dev';
const CONTACT_SUBJECT = 'ติดต่อสาระรัฐ';
const POLICY_UPDATED = '2026-10-08';

const SOURCES = [
  {
    name: 'รัฐบาลไทย',
    url: 'https://www.thaigov.go.th/th/news',
    note: 'ข่าวจากทำเนียบรัฐบาลและคณะรัฐมนตรี',
  },
  {
    name: 'กรมประชาสัมพันธ์',
    url: 'https://prd.go.th/main',
    note: 'ข่าวภาครัฐจากกรมประชาสัมพันธ์',
  },
  {
    name: 'กระทรวงเกษตรและสหกรณ์',
    url: 'https://www.moac.go.th',
    note: 'ข่าวสารด้านเกษตรและสหกรณ์',
  },
  {
    name: 'กรมสรรพากร',
    url: 'https://www.rd.go.th',
    note: 'ข่าวประชาสัมพันธ์ด้านภาษี',
  },
];

export const Route = createFileRoute('/policy')({
  head: () => ({
    meta: [
      { title: 'นโยบายและแหล่งข่าว · สาระรัฐ' },
      {
        name: 'description',
        content:
          'นโยบายการดึงข้อมูล แหล่งข่าว ข้อมูลที่แสดง ลิขสิทธิ์ API ลิงก์ภายนอก ความเป็นส่วนตัว การเข้าถึง การสนับสนุน และช่องทางแจ้งแก้ไขหรือลบเนื้อหาของสาระรัฐ',
      },
    ],
    links: [{ rel: 'canonical', href: `${SITE_URL}/policy` }],
  }),
  component: PolicyPage,
});

function PolicyPage() {
  return (
    <main id="content" className="container max-w-3xl pt-5 pb-4 sm:pt-10">
      <h1 className="text-title-md font-bold text-foreground sm:text-5xl">นโยบายและแหล่งข่าว</h1>
      <p className="mt-3 text-pretty text-muted-foreground">
        สาระรัฐเป็นแหล่งรวบรวมข่าวจากเว็บไซต์หน่วยงานรัฐ ไม่ใช่เว็บของทางราชการและไม่ได้สังกัดหน่วยงานใด
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        ปรับปรุงล่าสุด <time dateTime={POLICY_UPDATED}>{formatDate(POLICY_UPDATED)}</time>
      </p>

      <Section id="about" title="เกี่ยวกับสาระรัฐ">
        <p>
          สาระรัฐรวบรวมข่าว ประกาศ และข้อมูลจากเว็บไซต์หน่วยงานรัฐไทยมาแสดงไว้ในที่เดียว
          แต่ละรายการระบุชื่อหน่วยงานและมีลิงก์กลับไปยังต้นฉบับ
        </p>
        <p>
          ระบบเป็นแบบอ่านอย่างเดียว (read-only) เราไม่เปิดให้ผู้ใช้ส่ง แก้ไข หรือลบเนื้อหาข่าวด้วยตนเอง
          และไม่ได้แก้ไขสาระสำคัญของต้นฉบับ
        </p>
      </Section>

      <Section id="sources" title="แหล่งข่าว">
        <p>
          ปัจจุบันเราติดตาม 4 หน่วยงาน และตรวจสอบข่าวใหม่จากแต่ละหน่วยงานประมาณทุก 1–2 ชั่วโมง
          โดยดึงเฉพาะรายการล่าสุดที่เว็บไซต์นั้นเปิดเผย
        </p>
        <ul className="space-y-2">
          {SOURCES.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-foreground hover:underline hover:decoration-accent"
              >
                {source.name}
              </a>
              <span className="text-muted-foreground"> · {source.note}</span>
            </li>
          ))}
        </ul>
        <p>รายชื่อแหล่งข่าวอาจเพิ่มหรือลดลงได้ตามความเหมาะสม เราจะปรับหน้านี้ให้ตรงกับที่ระบบติดตามจริง</p>
      </Section>

      <Section id="content" title="ข้อมูลที่เราแสดง">
        <p>
          สำหรับแต่ละข่าว เราเก็บและแสดงหัวข้อ สรุป เนื้อหา รูปภาพ วันที่เผยแพร่ ชื่อหน่วยงาน และหมวดหมู่ (ถ้ามี)
          โดยดึงจากหน้าข่าวของหน่วยงานต้นทาง
        </p>
        <p>
          หากเรื่องเดียวกันปรากฏในหลายลิงก์ เราจะรวมไว้เป็นรายการเดียว
          และภาพที่ลิงก์เสียจะถูกนำออกเพื่อไม่ให้แสดงเป็นภาพแตก
        </p>
      </Section>

      <Section id="copyright" title="ลิขสิทธิ์และเนื้อหา">
        <p>
          เนื้อหาข่าวเป็นลิขสิทธิ์ของหน่วยงานต้นทาง สาระรัฐแสดงหัวข้อ สรุป และเนื้อหาที่หน่วยงานเผยแพร่ต่อสาธารณะ
          โดยไม่ได้อ้างความเป็นเจ้าของหรือดัดแปลงสาระสำคัญของข่าว รูปภาพและเอกสารแนบก็เป็นของหน่วยงานต้นทางเช่นกัน
        </p>
        <p>เราอาจปรับรูปแบบเล็กน้อยเพื่อให้อ่านง่ายขึ้น เช่น ตัดช่องว่างซ้ำหรือเครดิตท้ายข่าว แต่ไม่ตัดทอนสาระสำคัญ</p>
        <p>หากหน่วยงานหรือผู้ถือสิทธิ์ต้องการให้แก้ไขหรือนำเนื้อหาออก แจ้งได้ที่อีเมลด้านล่าง เราจะดำเนินการให้เร็วที่สุด</p>
      </Section>

      <Section id="crawling" title="การดึงข้อมูลและ robots.txt">
        <p>
          เราดึงข้อมูลด้วยโปรแกรมอัตโนมัติ จำกัดอัตราการเรียกต่อโฮสต์ มีการเว้นระยะและลองใหม่เมื่อผิดพลาด และปฏิบัติตาม
          robots.txt ของทุกเว็บไซต์
        </p>
        <p>
          ข้อยกเว้นหนึ่งกรณี: รัฐบาลไทย (thaigov.go.th) เผยแพร่รายการข่าวผ่าน API
          สาธารณะที่เว็บไซต์เองใช้แสดงผลเท่านั้น แต่ robots.txt ห้ามเส้นทาง /api/ ไว้ และไม่มีช่องทางอื่นให้ใช้
          เราจึงเรียก API นั้นเพื่อดึงหัวข้อและลิงก์ของข่าว
        </p>
      </Section>

      <Section id="api" title="API สำหรับนักพัฒนา">
        <p>
          เรามี API แบบอ่านอย่างเดียวสำหรับนักพัฒนา เปิดให้เรียกเฉพาะวิธี GET โดยไม่ต้องใช้คีย์
          และให้ข้อมูลชุดเดียวกับที่แสดงบนเว็บไซต์
        </p>
        <p>
          เอกสารประกอบอยู่ที่{' '}
          <a
            href={`${env.VITE_API_URL}/docs`}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-foreground underline decoration-accent"
          >
            {env.VITE_API_URL}/docs
          </a>
        </p>
        <p>
          API ให้บริการบนแผนฟรีของ Cloudflare Workers ซึ่งจำกัดประมาณ 100,000 คำขอต่อวัน
          หากปริมาณการใช้งานถึงขีดจำกัดติดต่อกันหลายวัน เราอาจจำกัดอัตราการเรียก
          หรืออนุญาตให้เรียกได้เฉพาะจากเว็บไซต์ของเรา เพื่อให้บริการยังใช้งานได้
        </p>
      </Section>

      <Section id="support" title="การสนับสนุน">
        <p>
          สาระรัฐให้บริการฟรี ไม่มีโฆษณา และไม่มีระบบสมาชิก หากท่านประสงค์จะสนับสนุนค่าใช้จ่ายในการดำเนินงาน
          เงินสนับสนุนทั้งหมดจะถูกนำไปพัฒนาบริการ เราจะประกาศช่องทางสนับสนุนบนหน้านี้เมื่อพร้อม
          และจะระบุรายละเอียดค่าใช้จ่ายว่าเป็นอะไร เท่าใด และชำระอย่างไร
        </p>
      </Section>

      <Section id="external" title="ลิงก์ภายนอก">
        <p>
          ลิงก์ “อ่านที่ต้นฉบับ” และลิงก์อื่นในหน้านี้พาออกไปนอกเว็บไซต์สาระรัฐ
          เราไม่ควบคุมและไม่รับผิดชอบต่อเนื้อหาหรือความปลอดภัยของเว็บไซต์ปลายทาง
        </p>
      </Section>

      <Section id="disclaimer" title="ข้อจำกัดความรับผิดชอบ">
        <p>
          เราพยายามดึงข้อมูลให้ครบและเป็นปัจจุบัน แต่ระบบอัตโนมัติอาจพลาด ล่าช้า หรือแสดงข้อมูลคลาดเคลื่อนได้
          ควรตรวจสอบข้อมูลสำคัญจากเว็บไซต์หน่วยงานต้นทางเสมอ
        </p>
        <p>เนื้อหาบนสาระรัฐมีไว้เพื่อการติดตามข่าวสาร ไม่ถือเป็นคำแนะนำหรือคำปรึกษาใด ๆ</p>
      </Section>

      <Section id="privacy" title="ความเป็นส่วนตัว">
        <p>
          สาระรัฐไม่มีระบบสมาชิก ไม่มีการตั้งคุกกี้เพื่อติดตาม และไม่ใช้เครื่องมือวิเคราะห์ผู้เข้าชม
          เราเก็บเฉพาะบันทึกเซิร์ฟเวอร์ที่จำเป็นต่อการให้บริการ
        </p>
      </Section>

      <Section id="accessibility" title="การเข้าถึง">
        <p>
          เราตั้งเป้าให้เว็บไซต์ใช้งานได้ด้วยคีย์บอร์ดและโปรแกรมอ่านหน้าจอ ตามแนวทาง WCAG 2.2 ระดับ AA
          หากพบปัญหาการเข้าถึง แจ้งได้ที่อีเมลด้านล่าง
        </p>
      </Section>

      <Section id="changes" title="การเปลี่ยนแปลงนโยบาย">
        <p>นโยบายนี้อาจปรับปรุงเมื่อระบบหรือแหล่งข่าวเปลี่ยน เราจะเผยแพร่ฉบับล่าสุดไว้ที่หน้านี้เสมอ</p>
      </Section>

      <Section id="contact" title="แจ้งแก้ไขหรือลบเนื้อหา">
        <p>
          พบข้อมูลไม่ถูกต้อง ต้องการแก้ไข หรือต้องการให้ลบเนื้อหา แจ้งได้ที่{' '}
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(CONTACT_SUBJECT)}`}
            className="font-semibold text-foreground underline decoration-accent"
          >
            {CONTACT_EMAIL}
          </a>
        </p>
      </Section>

      <Link
        to="/"
        search={{ source: undefined }}
        className={buttonVariants({ className: 'mt-10' })}
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> กลับหน้าแรก
      </Link>
    </main>
  );
}
