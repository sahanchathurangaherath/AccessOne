package lk.AccessOne.shared.sequence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Pure unit test -- the EntityManager is mocked, so this proves the format
 * string is right, not that the database sequence is unique under
 * concurrency (that guarantee has no equivalent without a live database;
 * see docs/test-cases.md for where that is covered manually instead).
 */
class SequenceGeneratorTest {

    private final EntityManager entityManager = mock(EntityManager.class);
    private final Query query = mock(Query.class);
    private final SequenceGenerator sequences = new SequenceGenerator();

    private void wire(String sequenceName, long nextValue) throws Exception {
        Field field = SequenceGenerator.class.getDeclaredField("entityManager");
        field.setAccessible(true);
        field.set(sequences, entityManager);
        when(entityManager.createNativeQuery(eq("SELECT NEXT VALUE FOR " + sequenceName))).thenReturn(query);
        when(query.getSingleResult()).thenReturn(nextValue);
    }

    @Test
    void formatsACardSerialWithSixDigitPadding() throws Exception {
        wire("dbo.seq_card_serial", 10L);

        String serial = sequences.next("dbo.seq_card_serial", "ACO", 6);

        assertThat(serial).isEqualTo("ACO-%d-000010".formatted(LocalDate.now().getYear()));
    }

    @Test
    void formatsAPrintJobNumberWithFourDigitPadding() throws Exception {
        wire("dbo.seq_print_job_no", 12L);

        String jobNo = sequences.next("dbo.seq_print_job_no", "PJ", 4);

        assertThat(jobNo).isEqualTo("PJ-%d-0012".formatted(LocalDate.now().getYear()));
    }

    @Test
    void aLargeValueIsNeverTruncatedEvenPastTheWidth() throws Exception {
        wire("dbo.seq_pass_no", 123456L);

        String passNo = sequences.next("dbo.seq_pass_no", "VP", 4);

        // Padding is a minimum, not a cap -- the sequence outliving its
        // padding width must still produce a correct, if wider, number.
        assertThat(passNo).isEqualTo("VP-%d-123456".formatted(LocalDate.now().getYear()));
    }
}
