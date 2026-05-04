import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Skeleton, Paper } from '@mui/material';

/**
 * Tableau squelette pendant le chargement des données.
 * Props :
 *   columns  number  nombre de colonnes (défaut : 5)
 *   rows     number  nombre de lignes   (défaut : 6)
 */
export default function SkeletonTable({ columns = 5, rows = 6 }) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        {Array.from({ length: columns }).map((_, i) => (
                            <TableCell key={i}>
                                <Skeleton variant="text" width="70%" height={20} />
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {Array.from({ length: rows }).map((_, r) => (
                        <TableRow key={r}>
                            {Array.from({ length: columns }).map((_, c) => (
                                <TableCell key={c}>
                                    <Skeleton variant="text" width={c === columns - 1 ? '50%' : '90%'} />
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
