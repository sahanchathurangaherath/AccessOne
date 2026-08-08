package lk.AccessOne.shared.web;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last
) {
    public static <E, D> PageResponse<D> of(Page<E> page, Function<E, D> mapper) {
        return new PageResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }

    /**
     * For results read through a native query with manual OFFSET/FETCH
     * rather than a Spring Data {@code Page<>} -- the pending-request
     * queue view, for one, where the paging happens in SQL Server's own
     * OFFSET ... FETCH NEXT rather than through a Pageable.
     */
    public static <D> PageResponse<D> ofList(List<D> content, int page, int size, long totalElements) {
        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new PageResponse<>(
                content, page, size, totalElements, totalPages,
                page == 0, page >= totalPages - 1
        );
    }
}
