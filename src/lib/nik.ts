/**
 * NIK pegawai (tmemp.C_NIK varchar(6)): umumnya angka, tetapi ada yang berhuruf,
 * mis. "DI2601". Cukup tidak kosong, tanpa spasi, maks. 6 karakter.
 */
export const isNik = (nik: string) => /^\S{1,6}$/.test(nik);

/**
 * Kolom NIK departemen (tmorgdet.C_NIK_ORG_DET) bertipe int: hanya NIK angka tanpa
 * nol di depan yang tersimpan utuh. NIK berhuruf / berawalan 0 hanya bisa untuk unit
 * (tmorg.C_NIK_ORG varchar).
 */
export const fitsDeptNik = (nik: string) => /^[1-9][0-9]*$/.test(nik);
