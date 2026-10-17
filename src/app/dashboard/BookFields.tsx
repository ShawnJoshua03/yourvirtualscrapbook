/* The recipient fields, shared by "start a book" and the book's settings. */
import ui from '@/components/ui.module.css';

type Values = { recipient_name?: string; nickname?: string; age?: number; birthday?: string; sign?: string | null; from_name?: string };

export default function BookFields({ v = {} }: { v?: Values }) {
  return (
    <>
      <div className={ui.grid2}>
        <label className={ui.field}>Their name<input className={ui.input} name="recipient_name" required maxLength={60} defaultValue={v.recipient_name} placeholder="Alex" /></label>
        <label className={ui.field}>What friends call them<input className={ui.input} name="nickname" maxLength={30} defaultValue={v.nickname} placeholder="Lex" /></label>
        <label className={ui.field}>Turning<input className={ui.input} name="age" type="number" inputMode="numeric" required min={1} max={130} defaultValue={v.age} placeholder="25" /></label>
        <label className={ui.field}>Birthday<input className={ui.input} name="birthday" required maxLength={40} defaultValue={v.birthday} placeholder="March 3" /></label>
        <label className={ui.field}>Star sign <small>optional</small><input className={ui.input} name="sign" maxLength={40} defaultValue={v.sign ?? ''} placeholder="Pisces ♓" /></label>
        <label className={ui.field}>Your name <small>signs the last letter</small><input className={ui.input} name="from_name" required maxLength={60} defaultValue={v.from_name} placeholder="Jordan" /></label>
      </div>
    </>
  );
}
